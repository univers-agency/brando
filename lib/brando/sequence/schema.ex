defmodule Brando.Sequence.Schema do
  @moduledoc """
  Sequencing macro for schema.

  ## Usage

      use Brando.Sequence.Schema

      schema "example" do
        sequenced()
      end


  ### With regular ids

      sequence %{"ids" => [3, 5, 1]}


  ### With composite keys:

  In your vue file, set the `<ContentList>`'s sort prop to `@sort="orderThings($event, exhibitionId)"`

  The sort function could then be

      sortWorks (workIds, exhibitionId) {
        const compositeKeys = workIds.map(workId => ({
          exhibition_id: exhibitionId,
          work_id: workId
        }))

        this.adminChannel.channel
          .push('exhibited_works:sequence_exhibited_works', { composite_keys: compositeKeys })
          .receive('ok', payload => {
            this.$toast.success({ message: 'Order updated' })
          })
      }

  Which will then produce

      sequence %{"composite_keys" => [%{"id" => 1, "additional_id" => 2}, %{...}]}

  in your admin channel
  """

  defmacro __using__(_) do
    quote do
      import unquote(__MODULE__)

      @doc """
      Sequences ids or composite keys

      With composite keys:

          sequence %{"composite_keys" => [%{"id" => 1, "additional_id" => 2}, %{...}]}

      With regular ids

          sequence %{"ids" => [3, 5, 1]}

      """
      def sequence(%{"composite_keys" => composite_keys}) do
        table = __MODULE__.__schema__(:source)

        Brando.repo().transaction(fn ->
          for {o, idx} <- Enum.with_index(composite_keys) do
            q = from t in table, update: [set: [sequence: ^idx]]

            q =
              Enum.reduce(o, q, fn {k, v}, nq ->
                from t in nq, where: field(t, ^String.to_existing_atom(k)) == ^v
              end)

            Brando.repo().update_all(q, [])
          end
        end)

        # update referenced Datasources in Villains
        Brando.Datasource.update_datasource(__MODULE__)
      end

      def sequence(%{"ids" => keys}) do
        # standard list of ids
        vals = Range.new(0, length(keys) - 1) |> Enum.to_list()
        table = __MODULE__.__schema__(:source)

        q =
          from a in table,
            join:
              numbers in fragment(
                "SELECT * FROM unnest(?, ?) AS t(key, value)",
                type(^keys, {:array, :integer}),
                type(^vals, {:array, :integer})
              ),
            on: a.id == numbers.key,
            update: [set: [sequence: numbers.value]]

        Brando.repo().update_all(q, [])

        # update referenced Datasources in Villains
        Brando.Datasource.update_datasource(__MODULE__)
      end
    end
  end

  defmacro sequenced do
    quote do
      Ecto.Schema.field(:sequence, :integer, default: 0)
    end
  end
end
