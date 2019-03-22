defmodule Brando.HTML do
  @moduledoc """
  Helper and convenience functions.
  """

  @type alert_levels :: :default | :primary | :info | :success | :warning | :danger

  import Brando.Gettext
  import Brando.Utils, only: [current_user: 1, active_path?: 2]
  import Brando.Meta.Controller, only: [put_meta: 3, get_meta: 1, get_meta: 2]
  import Phoenix.HTML
  import Phoenix.HTML.Tag

  @doc false
  defmacro __using__(_) do
    quote do
      import Brando.HTML
      import Brando.HTML.Inspect
    end
  end

  @doc """
  Returns `active` if `conn`'s `full_path` matches `current_path`.
  """
  @spec active(Plug.Conn.t(), String.t()) :: String.t()
  def active(conn, url_to_match, add_class? \\ nil) do
    result = (add_class? && ~s(class="active")) || "active"
    (active_path?(conn, url_to_match) && result) || ""
  end

  @doc """
  Checks if current_user in conn has `role`
  """
  @spec can_render?(Plug.Conn.t(), map) :: boolean
  def can_render?(_, %{role: nil}) do
    true
  end

  def can_render?(conn, %{role: role}) do
    current_user = current_user(conn)

    if current_user do
      (role in current_user(conn).role && true) || false
    else
      false
    end
  end

  def can_render?(_, _) do
    true
  end

  @doc """
  Zero pad `val` as a binary.

  ## Example

      iex> zero_pad(5)
      "005"

  """
  def zero_pad(str, count \\ 3)

  def zero_pad(val, count) when is_binary(val) do
    String.pad_leading(val, count, "0")
  end

  def zero_pad(val, count) do
    String.pad_leading(Integer.to_string(val), count, "0")
  end

  @doc """
  Split `full_name` and return first name
  """
  def first_name(full_name) do
    full_name
    |> String.split()
    |> hd
  end

  @doc """
  Returns a red X if value is nil, or a check if the value is truthy
  """
  def check_or_x(nil) do
    ~s(<i class="icon-centered fa fa-times text-danger"></i>)
  end

  def check_or_x(false) do
    ~s(<i class="icon-centered fa fa-times text-danger"></i>)
  end

  def check_or_x(_) do
    ~s(<i class="icon-centered fa fa-check text-success"></i>)
  end

  @doc """
  Displays a banner informing about cookie laws
  """
  def cookie_law(conn, text, opts \\ []) do
    if Map.get(conn.cookies, "cookielaw_accepted") != "1" do
      text = raw(text)
      button_text = Keyword.get(opts, :button_text, "OK")
      info_link = Keyword.get(opts, :info_link, "/cookies")
      info_text = Keyword.get(opts, :info_text)

      ~E|
      <div class="container cookie-container">
        <div class="cookie-container-inner">
          <div class="cookie-law">
            <div class="cookie-law-text">
              <p><%= text %></p>
            </div>
            <div class="cookie-law-buttons">
              <button
                class="dismiss-cookielaw">
                <%= button_text %>
              </button>
              <%= if info_text do %>
              <a
                href="<%= info_link %>"
                class="info-cookielaw">
                <%= info_text %>
              </a>
              <% end %>
            </div>
          </div>
        </div>
      </div>
      |
    end
  end

  @doc """
  Output Google Analytics code for `code`

  ## Example

      google_analytics("UA-XXXXX-X")

  """
  def google_analytics(code) do
    html = """
    <script>
    (function(b,o,i,l,e,r){b.GoogleAnalyticsObject=l;b[l]||(b[l]=
    function(){(b[l].q=b[l].q||[]).push(arguments)});b[l].l=+new Date;
    e=o.createElement(i);r=o.getElementsByTagName(i)[0];
    e.src='//www.google-analytics.com/analytics.js';
    r.parentNode.insertBefore(e,r)}(window,document,'script','ga'));
    ga('create','#{code}','auto');ga('set', 'anonymizeIp', true);ga('send','pageview');
    </script>
    """

    Phoenix.HTML.raw(html)
  end

  @doc """
  Render status indicators
  """
  def status_indicators do
    html = """
    <div class="status-indicators pull-left">
      <span class="m-r-sm">
        <span class="status-published">
          <i class="fa fa-circle m-r-sm"> </i>
        </span>
        #{gettext("Published")}
      </span>
      <span class="m-r-sm">
        <span class="status-pending">
          <i class="fa fa-circle m-r-sm"> </i>
        </span>
        #{gettext("Pending")}
      </span>
      <span class="m-r-sm">
        <span class="status-draft">
          <i class="fa fa-circle m-r-sm"> </i>
        </span>
        #{gettext("Draft")}
      </span>
      <span class="m-r-sm">
        <span class="status-deleted">
          <i class="fa fa-circle m-r-sm"> </i>
        </span>
        #{gettext("Deleted")}
      </span>
    </div>
    """

    Phoenix.HTML.raw(html)
  end

  @doc """
  Truncate `text` to `length`
  """
  def truncate(nil, _) do
    ""
  end

  def truncate(text, len) when is_binary(text) do
    (String.length(text) <= len && text) || String.slice(text, 0..len) <> "..."
  end

  def truncate(val, _) do
    val
  end

  @doc """
  Renders a <meta> tag
  """
  def meta_tag({"og:" <> og_property, content}) do
    tag(:meta, content: content, property: "og:" <> og_property)
  end

  def meta_tag({name, content}) do
    tag(:meta, content: content, name: name)
  end

  def meta_tag(attrs) when is_list(attrs) do
    tag(:meta, attrs)
  end

  def meta_tag("og:" <> og_property, content) do
    tag(:meta, content: content, property: "og:" <> og_property)
  end

  def meta_tag(name, content) do
    tag(:meta, content: content, name: name)
  end

  @doc """
  Renders all meta/opengraph
  """
  def render_meta(conn) do
    app_name = Brando.config(:app_name)
    title = Brando.Utils.get_page_title(conn)

    conn =
      conn
      |> put_meta("og:title", "#{title}")
      |> put_meta("og:site_name", app_name)
      |> put_meta("og:type", "website")
      |> put_meta("og:url", Brando.Utils.current_url(conn))

    conn =
      case get_meta(conn, "keywords") do
        nil ->
          if meta_keywords = Brando.Config.get_site_config("meta_keywords") do
            put_meta(conn, "keywords", meta_keywords)
          else
            conn
          end

        _ ->
          conn
      end

    conn =
      case get_meta(conn, "description") do
        nil ->
          if meta_description = Brando.Config.get_site_config("meta_description") do
            conn
            |> put_meta("description", meta_description)
            |> put_meta("og:description", meta_description)
          else
            conn
          end

        _ ->
          conn
      end

    conn =
      case get_meta(conn, "og:image") do
        nil ->
          if meta_image = Brando.Config.get_site_config("meta_image") do
            img =
              if String.contains?(meta_image, "://") do
                meta_image
              else
                Path.join("#{conn.scheme}://#{conn.host}", meta_image)
              end

            conn
            |> put_meta("image", img)
            |> put_meta("og:image", img)
          else
            conn
          end

        img ->
          if String.contains?(img, "://") do
            conn
          else
            put_meta(conn, "og:image", Path.join("#{conn.scheme}://#{conn.host}", img))
          end
      end

    html = Enum.map_join(get_meta(conn), "\n    ", &elem(meta_tag(&1), 1))
    Phoenix.HTML.raw("    #{html}")
  end

  @doc """
  Renders opening body tag.

  Checks conn.private for various settings
  """
  def body_tag(conn, opts \\ []) do
    id = Keyword.get(opts, :id, nil)
    data_script = conn.private[:brando_section_name]
    classes = conn.private[:brando_css_classes]

    body = "<body"

    body =
      if id,
        do: body <> ~s( id="#{id}"),
        else: body

    body =
      if data_script,
        do: body <> ~s( data-script="#{data_script}"),
        else: body

    body =
      if classes,
        do: body <> ~s( class="#{classes} unloaded"),
        else: body <> ~s( class="unloaded")

    Phoenix.HTML.raw(body <> ">")
  end

  @doc """
  Displays all flash messages in conn
  """
  def display_flash(conn) do
    flash = Phoenix.Controller.get_flash(conn)

    for {type, msg} <- flash do
      """
      <div class="alert alert-block alert-#{type}">
        <a class="close pull-right" data-dismiss="alert" href="#">×</a>
        <i class="fa fa-exclamation-circle m-r-sm"> </i>
        #{msg}
      </div>
      """
      |> Phoenix.HTML.raw()
    end
  end

  @doc """
  Outputs an `img` tag marked as safe html

  The `srcset` attribute is the ACTUAL width of the image, as saved to disk. You'll find that in the
  image type's `sizes` map.

  ## Options:

    * `prefix` - string to prefix to the image's url. I.e. `prefix: media_url()`
    * `default` - default value if `image_field` is nil. Does not respect `prefix`, so use
      full path.
    * `cache` - key to cache by, i.e `cache: schema.updated_at`
    * `srcset` - if you want to use the srcset attribute. Set in the form of `{module, field}`.
      I.e `srcset: {Brando.User, :avatar}`
      You can also reference a config struct directly:
      I.e `srcset: image_series.cfg`
      Or supply a srcset directly:
        srcset: %{
          "small" => "300w",
          "medium" => "582w",
          "large" => "936w",
          "xlarge" => "1200w"
        }
    * `attrs` - extra attributes to the tag, ie data attrs
  """
  def img_tag(image_field, size, opts \\ []) do
    srcset_attr =
      (Keyword.get(opts, :srcset) && [srcset: get_srcset(image_field, opts[:srcset], opts)]) || []

    sizes_attr = (Keyword.get(opts, :sizes) && [sizes: get_sizes(opts[:sizes])]) || []
    width_attr = (Keyword.get(opts, :width) && [width: Map.get(image_field, :width)]) || []
    height_attr = (Keyword.get(opts, :height) && [height: Map.get(image_field, :height)]) || []
    extra_attrs = Keyword.get(opts, :attrs, [])
    lightbox = Keyword.get(opts, :lightbox, false)
    img_src = Brando.Utils.img_url(image_field, size, opts)

    attrs =
      Keyword.new()
      |> Keyword.put(:src, img_src)
      |> Keyword.merge(
        Keyword.drop(opts, [:lightbox, :cache, :attrs, :prefix, :srcset, :sizes, :default]) ++
          sizes_attr ++ srcset_attr ++ width_attr ++ height_attr ++ extra_attrs
      )

    # if we have srcset, set src as empty svg
    attrs = (srcset_attr != [] && Keyword.put(attrs, :src, svg_fallback(image_field))) || attrs

    if lightbox do
      ~E|
        <a href="<%= img_src %>" data-lightbox>
          <%= tag(:img, attrs) %>
        </a>
      |
    else
      tag(:img, attrs)
    end
  end

  @doc """
  Outputs a `picture` tag with source, img and a noscript fallback

  The `srcset` attribute is the ACTUAL width of the image, as saved to disk. You'll find that in the
  image type's `sizes` map.

  ## Options:

    * `prefix` - string to prefix to the image's url. I.e. `prefix: media_url()`
    * `picture_class` - class added to the picture root element
    * `img_class` - class added to the img element. I.e img_class: "img-fluid"
    * `srcset` - if you want to use the srcset attribute. Set in the form of `{module, field}`.
      I.e `srcset: {Brando.User, :avatar}`
      You can also reference a config struct directly:
      I.e `srcset: image_series.cfg`
      Or supply a srcset directly:
        srcset: %{
          "small" => "300w",
          "medium" => "582w",
          "large" => "936w",
          "xlarge" => "1200w"
        }
  """
  @spec picture_tag(Map.t(), keyword()) :: {:safe, [...]}
  def picture_tag(img_field, opts \\ []) do
    src = Brando.Utils.img_url(img_field, Keyword.get(opts, :size, :xlarge), opts)
    sizes = (Keyword.get(opts, :sizes) && get_sizes(opts[:sizes])) || false
    srcset = (Keyword.get(opts, :srcset) && get_srcset(img_field, opts[:srcset], opts)) || false
    width = (Keyword.get(opts, :width) && Map.get(img_field, :width)) || false
    height = (Keyword.get(opts, :height) && Map.get(img_field, :height)) || false
    img_class = Keyword.get(opts, :img_class, false)
    picture_class = Keyword.get(opts, :picture_class, false)

    picture_attrs = [
      class: picture_class
    ]

    source_attrs = [
      data_srcset: srcset,
      sizes: sizes
    ]

    img_attrs = [
      data_srcset: srcset,
      data_src: src,
      sizes: sizes,
      class: img_class,
      width: width,
      height: height
    ]

    noscript_img_attrs = [
      src: src,
      class: img_class
    ]

    img_tag = tag(:img, img_attrs)
    noscript_img_tag = tag(:img, noscript_img_attrs)
    source_tag = tag(:source, source_attrs)
    noscript_tag = content_tag(:noscript, noscript_img_tag)
    content_tag(:picture, [source_tag, img_tag, noscript_tag], picture_attrs)
  end

  def ratio(%{height: height, width: width}) when is_nil(height) or is_nil(width), do: 0

  def ratio(%{height: height, width: width}) do
    Decimal.new(height)
    |> Decimal.div(Decimal.new(width))
    |> Decimal.mult(Decimal.new(100))
  end

  def ratio(nil), do: 0

  def svg_fallback(image_field) do
    width = Map.get(image_field, :width, 0)
    height = Map.get(image_field, :height, 0)

    "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg" <>
      "%27%20width%3D%27#{width}%27%20height%3D%27#{height}%27" <>
      "%20style%3D%27background%3Atransparent%27%2F%3E"
  end

  @doc """
  Get sizes from image config
  """
  def get_sizes(nil), do: nil

  def get_sizes(sizes) when is_list(sizes) do
    Enum.join(sizes, ", ")
  end

  def get_sizes(_) do
    raise ArgumentError,
      message: ~s<sizes key must be a list: ["(min-width: 36em) 33.3vw", "100vw"]>
  end

  @doc """
  Get srcset from image config
  """
  def get_srcset(_, nil, _), do: nil

  def get_srcset(image_field, {mod, field}, opts) do
    {:ok, cfg} = apply(mod, :get_image_cfg, [field])

    if !cfg.srcset do
      raise ArgumentError,
        message: "no `:srcset` key set in #{inspect(mod)}'s #{inspect(field)} image config"
    end

    srcset_values =
      for {k, v} <- cfg.srcset do
        path = Brando.Utils.img_url(image_field, k, opts)
        "#{path} #{v}"
      end

    Enum.join(srcset_values, ", ")
  end

  def get_srcset(image_field, %Brando.Type.ImageConfig{} = cfg, opts) do
    if !cfg.srcset do
      raise ArgumentError, message: "no `:srcset` key set in supplied image config"
    end

    srcset = sort_srcset(cfg.srcset)

    srcset_values =
      for {k, v} <- srcset do
        path = Brando.Utils.img_url(image_field, k, opts)
        "#{path} #{v}"
      end

    Enum.join(srcset_values, ", ")
  end

  def get_srcset(image_field, srcset, opts) do
    srcset_values =
      for {k, v} <- srcset do
        path = Brando.Utils.img_url(image_field, k, opts)
        "#{path} #{v}"
      end

    Enum.join(srcset_values, ", ")
  end

  defp sort_srcset(map) when is_map(map) do
    Map.to_list(map)
    |> Enum.sort(fn {_k1, s1}, {_k2, s2} ->
      t1 =
        s1
        |> String.replace("w", "")
        |> String.replace("h", "")
        |> String.replace("wv", "")
        |> String.replace("hv", "")
        |> String.to_integer()

      t2 =
        s2
        |> String.replace("w", "")
        |> String.replace("h", "")
        |> String.replace("wv", "")
        |> String.replace("hv", "")
        |> String.to_integer()

      t1 > t2
    end)
  end

  defp sort_srcset(list), do: list
end
