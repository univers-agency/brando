defmodule <%= base %>.<%= domain %> do
  @moduledoc """
  Context for <%= human %>
  """

  # ++types
  @type id :: Integer.t() | String.t()
  @type params :: Map.t()
  @type user :: Brando.Users.User.t()
  # __types

  alias <%= base %>.Repo
  import Ecto.Query

  # ++header
  # __header

  # ++code
  @doc """
  Dataloader initializer
  """
  def data() do
    Dataloader.Ecto.new(
      Brando.repo(),
      query: &query/2
    )
  end

  @doc """
  Dataloader queries
  """
  def query(queryable, _), do: queryable

  # __code
end
