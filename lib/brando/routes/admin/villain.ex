defmodule Brando.Villain.Routes.Admin.API do
  @moduledoc """
  Routes for Brando.Villain

  ## Usage:

  In `router.ex`

      scope "/admin", as: :admin do
        pipe_through :admin
        api_villain_routes()
      end

  """

  @doc """
  Defines "RESTful" endpoints for the news resource.
  """
  defmacro api_villain_routes do
    add_villain_routes("", Brando.API.Villain.VillainController)
  end

  defp add_villain_routes(path, controller) do
    quote do
      path = unquote(path)
      ctrl = unquote(controller)
      opts = []

      post "#{path}/villain/upload", ctrl, :upload_image, opts
      get "#{path}/villain/templates/:slug", ctrl, :templates, opts
      post "#{path}/villain/templates/", ctrl, :store_template, opts
      post "#{path}/villain/templates/delete", ctrl, :delete_template, opts
      post "#{path}/villain/templates/sequence", ctrl, :sequence_templates, opts
      get "#{path}/villain/browse/:slug", ctrl, :browse_images, opts
    end
  end
end
