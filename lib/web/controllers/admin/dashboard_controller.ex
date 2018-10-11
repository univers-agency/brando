defmodule Brando.Admin.DashboardController do
  @moduledoc """
  A module for the admin dashboard.
  """

  use Brando.Web, :controller
  import Brando.Plug.HTML
  import Brando.Gettext

  plug :put_section, "dashboard"

  @doc """
  Renders the main dashboard for the admin area.
  """
  def dashboard(conn, _params) do
    render(conn)
  end

  @doc """
  Renders system info page.
  """
  def system_info(conn, _params) do
    log_file = Path.join([Brando.config(:log_dir), "#{Brando.config(:otp_app)}.log"])
    {log_last_updated, log_last_lines} = get_log_info(log_file)

    conn
    |> assign(:deps_versions, Brando.Utils.get_deps_versions())
    |> assign(:log_last_lines, log_last_lines)
    |> assign(:log_last_updated, log_last_updated)
    |> render
  end

  @doc """
  Dummy action for raising and testing 500 page + error handling.
  """
  def dummy_raise(_, _) do
    raise "boom!"
  end

  defp get_log_info(log_file) do
    case File.stat(log_file) do
      {:ok, stat} ->
        last_updated =
          stat.mtime
          |> NaiveDateTime.from_erl!()
          |> NaiveDateTime.to_string()

        last_lines =
          log_file
          |> File.stream!()
          |> Enum.reverse()
          |> Enum.take(30)
          |> Enum.reverse()

        {last_updated, last_lines}

      {:error, _} ->
        {"", gettext("File not found")}
    end
  end
end