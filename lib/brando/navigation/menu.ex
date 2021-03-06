defmodule Brando.Navigation.Menu do
  @moduledoc """
  Ecto schema for the Menu schema.
  """

  @type t :: %__MODULE__{}
  @type user :: Brando.Users.User.t() | :system

  use Brando.Web, :schema
  use Brando.Sequence.Schema
  use Brando.Schema

  meta :en, singular: "menu", plural: "menus"
  meta :no, singular: "meny", plural: "menyer"
  identifier fn entry -> "#{entry.title} [#{entry.language}]" end
  absolute_url false

  schema "navigation_menus" do
    field :status, Brando.Type.Status
    field :title, :string
    field :key, :string
    field :language, :string
    field :template, :string

    belongs_to :creator, Brando.Users.User
    embeds_many :items, Brando.Navigation.Item, on_replace: :delete

    sequenced()
    timestamps()
  end

  @required_fields ~w(status title key language creator_id)a
  @optional_fields ~w(template sequence)a

  @doc """
  Casts and validates `params` against `schema` to create a valid changeset

  ## Example

      schema_changeset = changeset(%__MODULE__{}, :create, params)

  """
  @spec changeset(t, Keyword.t() | Options.t(), user) :: Ecto.Changeset.t()
  def changeset(schema, params \\ %{}, user \\ :system) do
    schema
    |> cast(params, @required_fields ++ @optional_fields)
    |> cast_embed(:items, with: &Brando.Navigation.Item.changeset/2)
    |> put_creator(user)
    |> validate_required(@required_fields)
    |> unique_constraint([:key])
  end
end
