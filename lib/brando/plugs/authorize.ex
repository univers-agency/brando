defmodule Brando.Plug.Authorize do
  @moduledoc """
  A plug for checking roles on user.
  """
  import Plug.Conn
  import Phoenix.Controller, only: [render: 2, put_view: 2]
  alias Brando.User

  @doc """
  Check `conn` for current_user's `role`.
  Halts on failure.
  """
  def authorize(%{private: %{plug_session: %{"current_user" => current_user}}} = conn, role) do
    if User.has_role?(current_user, role), do: conn, else: conn |> no_access
  end
  def authorize(conn, _) do
    conn |> no_access
  end
  defp no_access(conn) do
    conn
    |> put_view(Brando.AuthView)
    |> render(:no_access)
    |> halt
  end
end