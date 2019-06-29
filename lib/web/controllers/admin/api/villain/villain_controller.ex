defmodule Brando.API.Villain.VillainController do
  @moduledoc """
  The API backend for villain-editor JS.
  """
  use Brando.Web, :controller
  alias Brando.Images
  alias Brando.Villain
  import Ecto.Query

  @doc false
  def browse_images(conn, %{"slug" => series_slug}) do
    image_series =
      Brando.ImageSeries
      |> preload([:image_category, :images])
      |> Brando.repo().get_by(slug: series_slug)

    if image_series do
      image_list = Villain.map_images(image_series.images)
      json(conn, %{status: 200, images: image_list})
    else
      json(conn, %{status: 204, images: []})
    end
  end

  @doc false
  def upload_image(conn, %{"uid" => uid, "slug" => series_slug} = params) do
    user = Brando.Utils.current_user(conn)

    series =
      Brando.ImageSeries
      |> preload(:image_category)
      |> Brando.repo().get_by(slug: series_slug)

    if series == nil do
      raise Brando.Exception.UploadError,
            "villain could not find image series `#{series_slug}`. \n\n" <>
              "Make sure it exists before using it as an upload target!\n"
    end

    cfg = series.cfg || Brando.config(Brando.Images)[:default_config]
    params = Map.put(params, "image_series_id", series.id)

    case Images.Uploads.Schema.handle_upload(params, cfg, user) do
      {:error, err} ->
        json(
          conn,
          %{
            status: 500,
            error: err
          }
        )

      images when length(images) > 1 ->
        images =
          Enum.map(images, fn {:ok, img} ->
            sizes = Enum.map(img.image.sizes, fn {k, v} -> {k, Brando.Utils.media_url(v)} end)
            sizes_map = Enum.into(sizes, %{})
            %{id: img.id, sizes: sizes_map, src: Brando.Utils.media_url(img.image.path)}
          end)

        json(
          conn,
          %{
            status: 200,
            uid: uid,
            images: images
          }
        )

      [{:ok, image}] ->
        sizes = Enum.map(image.image.sizes, fn {k, v} -> {k, Brando.Utils.media_url(v)} end)
        sizes_map = Enum.into(sizes, %{})

        json(
          conn,
          %{
            status: 200,
            uid: uid,
            image: %{
              id: image.id,
              sizes: sizes_map,
              src: Brando.Utils.media_url(image.image.path),
              width: image.image.width,
              height: image.image.height
            },
            form: %{
              method: "post",
              action: "villain/imagedata/#{image.id}",
              name: "villain-imagedata",
              fields: [
                %{
                  name: "title",
                  type: "text",
                  label: "Tittel",
                  value: ""
                },
                %{
                  name: "credits",
                  type: "text",
                  label: "Krediteringer",
                  value: ""
                }
              ]
            }
          }
        )
    end
  end

  @doc false
  def slideshow(conn, %{"slug" => series_slug}) do
    series_query =
      from is in Brando.ImageSeries,
        join: c in assoc(is, :image_category),
        join: i in assoc(is, :images),
        where: c.slug == "slideshows" and is.slug == ^series_slug,
        order_by: i.sequence,
        preload: [image_category: c, images: i]

    series = Brando.repo().one!(series_query)

    images =
      Enum.map(
        series.images,
        &Brando.Utils.img_url(&1.image, :thumb, prefix: Brando.Utils.media_url())
      )

    json(conn, %{
      status: 200,
      series: series_slug,
      images: images
    })
  end

  @doc false
  def slideshows(conn, _) do
    series =
      Brando.repo().all(
        from is in Brando.ImageSeries,
          join: c in assoc(is, :image_category),
          where: c.slug == "slideshows",
          order_by: is.slug,
          preload: [image_category: c]
      )

    series_slugs = Enum.map(series, & &1.slug)
    json(conn, %{status: 200, series: series_slugs})
  end

  @doc false
  def image_info(conn, %{"form" => form, "id" => id, "uid" => uid}) do
    form = URI.decode_query(form)
    image = Brando.repo().get(Brando.Image, id)

    {:ok, updated_image} =
      Brando.Images.update_image_meta(image, form["title"], form["credits"], %{
        "x" => 50,
        "y" => 50
      })

    info = %{
      status: 200,
      id: id,
      uid: uid,
      title: updated_image.image.title,
      credits: updated_image.image.credits,
      link: form["link"],
      focal: %{"x" => 50, "y" => 50}
    }

    json(conn, info)
  end

  @doc false
  def templates(conn, %{"slug" => slug}) do
    {:ok, templates} = Villain.list_templates(slug)

    formatted_templates =
      Enum.map(templates, fn template ->
        %{
          type: "template",
          data: template
        }
      end)

    json(conn, formatted_templates)
  end

  @doc false
  def store_template(conn, %{"template" => json_template}) do
    with {:ok, decoded_template} <- Jason.decode(json_template),
         {:ok, stored_template} <- Villain.update_or_create_template(decoded_template) do
      response = %{
        status: 200,
        template: stored_template
      }

      json(conn, response)
    end
  end
end
