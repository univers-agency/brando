defmodule Brando.Admin.ImageController do
  @moduledoc """
  Controller for the Brando ImageCategory module.
  """
  use Linguist.Vocabulary
  use Brando.Web, :controller
  import Brando.Plug.Section

  plug :put_section, "images"

  @doc false
  def index(conn, _params) do
    language = Brando.I18n.get_language(conn)
    # show images by tabbed category, then series.
    category_model = conn.private[:category_model]
    categories =
      category_model
      |> category_model.with_image_series_and_images
      |> Brando.repo.all

    conn
    |> assign(:page_title, t!(language, "title.index"))
    |> assign(:categories, categories)
    |> render(:index)
  end

  @doc false
  def delete_selected(conn, %{"ids" => ids}) do
    model = conn.private[:image_model]
    model.delete(ids)
    conn |> render(:delete_selected, ids: ids)
  end

  locale "no", [
    title: [
      index: "Bildeoversikt",
    ]
  ]

  locale "en", [
    title: [
      index: "Index – Images",
    ]
  ]
end
