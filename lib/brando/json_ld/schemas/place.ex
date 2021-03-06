defmodule Brando.JSONLD.Schema.Place do
  @moduledoc """
  Place schema
  """

  alias Brando.JSONLD.Schema

  @derive Jason.Encoder
  defstruct "@context": "http://schema.org",
            "@type": "Place",
            address: nil,
            name: nil

  def build(data) do
    %__MODULE__{
      address: Schema.PostalAddress.build(data),
      name: Map.get(data, :name)
    }
  end
end
