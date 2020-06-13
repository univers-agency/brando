defmodule Brando.Type.Image do
  @moduledoc """
  Defines a type for an image field.
  """

  use Ecto.Type

  @type t :: %__MODULE__{}

  @derive {Jason.Encoder, only: [:title, :credits, :alt, :path, :sizes, :width, :height, :focal]}

  defstruct title: nil,
            credits: nil,
            alt: nil,
            path: nil,
            sizes: %{},
            width: nil,
            height: nil,
            focal: %{x: 50, y: 50}

  @doc """
  Returns the internal type representation of our image type for pg
  """
  def type, do: :jsonb

  @doc """
  Cast should return OUR type no matter what the input.
  """
  def cast(val) when is_binary(val) do
    val = Poison.decode!(val, as: %Brando.Type.Image{})
    {:ok, val}
  end

  # def cast(%Brando.Type.Image{} = val) when is_map(val), do: {:ok, val}

  # if we get a Plug Upload or a Focal struct, we pass it on.. it gets handled later!
  # def cast(%Plug.Upload{} = val), do: {:ok, val}
  # def cast(%Brando.Type.Focal{} = val), do: {:ok, val}
  def cast(%{file: %Plug.Upload{}} = upload) do
    {:ok, {:upload, upload}}
  end

  def cast(%Brando.Type.Image{} = image) do
    {:ok, image}
  end

  def cast(update) when is_map(update) do
    {:ok, {:update, update}}
  end

  # def cast(val) when is_map(val), do: {:ok, Brando.Utils.stringy_struct(Brando.Type.Image, val)}

  @doc """
  Integers are never considered blank
  """
  def blank?(_), do: %Brando.Type.Image{}

  @doc """
  Load
  """
  def load(%Brando.Type.Image{} = val) when is_map(val), do: {:ok, val}
  def load(val), do: {:ok, Brando.Utils.stringy_struct(Brando.Type.Image, val)}

  @doc """
  When dumping data to the database we expect a `list`, but check for
  other options as well.
  """
  def dump(val), do: {:ok, val}
end
