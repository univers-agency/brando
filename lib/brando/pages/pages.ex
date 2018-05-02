defmodule Brando.Pages do
  @moduledoc """
  Context for pages
  """
  alias Brando.Pages.Page
  alias Brando.Pages.PageFragment

  import Ecto.Query

  defmacro __using__(_) do
    quote do
      import Brando.Pages, only: [get_page_fragments: 1, render_fragment: 2]
    end
  end

  @doc """
  Create new page
  """
  def create_page(params, user) do
    %Page{}
    |> Brando.Utils.Schema.put_creator(user)
    |> Page.changeset(:create, params)
    |> Brando.repo.insert
  end

  @doc """
  Update page
  """
  def update_page(page_id, params) do
    page_id = is_binary(page_id) && String.to_integer(page_id) || page_id
    {:ok, page} = get_page(page_id)

    page
    |> Page.changeset(:update, params)
    |> Brando.repo.update
  end

  @doc """
  Delete page
  """
  def delete_page(page_id) do
    {:ok, page} = get_page(page_id)
    Brando.repo.delete(page)
    {:ok, page}
  end

  @doc """
  List all pages
  """
  def list_pages() do
    pages =
      Page
      |> Page.only_parents()
      |> order_by([p], asc: p.key)
      |> Brando.repo.all

    {:ok, pages}
  end

  @doc """
  List page parents
  """
  def list_parents() do
    no_value = %{value: nil, name: "–"}
    parents =
      Page
      |> Page.only_parents
      |> Brando.repo.all

    val =
      if parents do
        parents
        |> Enum.reverse
        |> Enum.reduce([no_value], fn(parent, acc) ->
             acc ++ [%{value: parent.id, name: "#{parent.key} (#{parent.language})"}]
           end)
      else
        [no_value]
      end
    {:ok, val}
  end

  @doc """
  Get page by key
  """
  def get_page(key) when is_binary(key) do
    page = Brando.repo.get_by(Page, key: key)

    case page do
      nil  -> {:error, {:page, :not_found}}
      page -> {:ok, page}
    end
  end

  @doc """
  Get page by id
  """
  def get_page(id) do
    page = Brando.repo.get(Page, id)

    case page do
      nil  -> {:error, {:page, :not_found}}
      page -> {:ok, page}
    end
  end

  def rerender_pages() do
    {:ok, pages} = list_pages()

    for page <- pages do
      Page.rerender_html(Page.changeset(page, :update, %{}))
    end
  end

  @doc """
  List all page fragments
  """
  def list_page_fragments() do
    fragments =
      PageFragment
      |> order_by([p], [asc: p.parent_key, asc: p.key])
      |> Brando.repo.all()

    {:ok, fragments}
  end

  @doc """
  Get page by key
  """
  def get_page_fragment(key) when is_binary(key) do
    page = Brando.repo.get_by(PageFragment, key: key)

    case page do
      nil  -> {:error, {:page_fragment, :not_found}}
      page -> {:ok, page}
    end
  end

  @doc """
  Get page by id
  """
  def get_page_fragment(id) do
    page = Brando.repo.get(PageFragment, id)

    case page do
      nil  -> {:error, {:page_fragment, :not_found}}
      page -> {:ok, page}
    end
  end

  @doc """
  Get set of fragments by parent key
  """
  def get_page_fragments(parent_key) do
    fragments =
      PageFragment
      |> where([p], p.parent_key == ^parent_key)
      |> Brando.repo.all

    Enum.reduce(fragments, %{}, fn (x, acc) -> Map.put(acc, x.key, x) end)
  end

  @doc """
  Create new page fragment
  """
  def create_page_fragment(params, user) do
    %PageFragment{}
    |> Brando.Utils.Schema.put_creator(user)
    |> PageFragment.changeset(:create, params)
    |> Brando.repo.insert
  end

  @doc """
  Update page fragment
  """
  def update_page_fragment(page_fragment_id, params) do
    page_fragment_id = is_binary(page_fragment_id) && String.to_integer(page_fragment_id) || page_fragment_id
    {:ok, page_fragment} = get_page_fragment(page_fragment_id)

    page_fragment
    |> PageFragment.changeset(:update, params)
    |> Brando.repo.update
  end

  @doc """
  Delete page_fragment
  """
  def delete_page_fragment(page_fragment_id) do
    {:ok, page_fragment} = get_page_fragment(page_fragment_id)
    Brando.repo.delete(page_fragment)
    {:ok, page_fragment}
  end

  @doc """
  Fetch a page fragment by `key`.

  ## Example:

      fetch_fragment("my/fragment", Gettext.get_locale(MyApp.Gettext)
      fetch_fragment("my/fragment", "en")

  If no language is passed, default language set in `brando.exs` will be used.
  If the fragment isn't found, it will render an error box.
  """
  def fetch_fragment(key, language \\ nil) when is_binary(key) do
    language = language || Brando.config(:default_language)
    fragment = Brando.repo.one(
      from p in PageFragment,
        where: p.key == ^key and p.language == ^language
    )

    case fragment do
      nil ->
        ~s(<div class="page-fragment-missing">
             <strong>Missing page fragment</strong> <br />
             key..: #{key}<br />
             lang.: #{language}
           </div>) |> Phoenix.HTML.raw
      fragment ->
        Phoenix.HTML.raw(fragment.html)
    end
  end

  def render_fragment(fragments, key) when is_map(fragments) do
    case Map.get(fragments, key) do
      nil ->
        ~s(<div class="page-fragment-missing text-mono">
             <strong>Missing page fragment</strong> <br />
             key...: #{key}<br />
             frags.: #{inspect Map.keys(fragments)}
           </div>) |> Phoenix.HTML.raw
      fragment ->
        Phoenix.HTML.raw(fragment.html)
    end
  end

  def render_fragment(parent, key, language \\ nil) when is_binary(parent) and is_binary(key) do
    language = language || Brando.config(:default_language)
    fragment = Brando.repo.one(
      from p in PageFragment,
        where: p.parent_key == ^parent and
               p.key == ^key and
              p.language == ^language
    )

    case fragment do
      nil ->
        ~s(<div class="page-fragment-missing">
             <strong>Missing page fragment</strong> <br />
             parent: #{parent}<br />
             key...: #{key}<br />
             lang..: #{language}
           </div>) |> Phoenix.HTML.raw
      fragment ->
        Phoenix.HTML.raw(fragment.html)
    end
  end
end
