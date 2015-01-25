defmodule Brando.Type.Role do
  use Bitwise, only_operators: true
  require Logger

  @behaviour Ecto.Type
  @roles %{staff: 1, admin: 2, superuser: 4}

  @doc """
  Returns the internal type representation of our `Role` type for pg
  """
  def type, do: :integer

  @doc """
  Cast should return OUR type no matter what the input.
  In this case, `list` will be a list of binaries from a form.
  Ex: ["1", "2", "4"]
  """
  def cast(list) when is_list(list) do
    # first turn the list of binaries into a sum
    roles = Enum.reduce(list, 0, fn (role, acc) ->
      cond do
        is_binary(role) -> acc + String.to_integer(role)
      end
    end)

    acc = Enum.reduce(@roles, [], fn ({role_k, role_v}, acc) ->
      case (roles &&& role_v) == role_v do
        true -> [role_k|acc]
        false -> acc
      end
    end)
    {:ok, acc}
  end

  @doc """
  Cast anything else is a failure
  """
  def cast(_), do: :error

  @doc """
  Integers are never considered blank
  """
  def blank?(_), do: false

  @doc """
  When loading `roles` from the database, we are guaranteed to
  receive an integer (as database are stricts) and we will
  just return it to be stored in the model struct.
  """
  def load(roles) when is_integer(roles) do
    acc = Enum.reduce(@roles, [], fn ({role_k, role_v}, acc) ->
      case (roles &&& role_v) == role_v do
        true -> [role_k|acc]
        false -> acc
      end
    end)
    {:ok, acc}
  end

  @doc """
  When dumping data to the database we expect a `list`, but check for
  other options as well.
  """
  def dump(integer) when is_integer(integer), do: {:ok, integer}
  def dump(string) when is_binary(string), do: {:ok, String.to_integer(string)}
  def dump(list) when is_list(list) do
    acc = Enum.reduce(list, 0, fn (role, acc) ->
        acc + @roles[role]
    end)
    {:ok, acc}
  end
  def dump(_), do: :errorend
  def dump(), do: :errorend
end