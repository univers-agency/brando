defmodule Brando.TestRouter do
  use Phoenix.Router
  alias Brando.Plug.Authenticate
  import Brando.Routes.Admin.Users
  import Brando.Routes.Admin.News
  import Brando.Routes.Admin.Images
  import Brando.Routes.Admin.Villain

  pipeline :admin do
    plug :accepts, ~w(html json)
    plug :fetch_session
    plug :fetch_flash
    plug :put_layout, {Brando.Admin.LayoutView, "admin.html"}
    plug Authenticate, login_url: "/login"
  end

  pipeline :browser do
    plug :accepts, ~w(html)
    plug :fetch_session
    plug :fetch_flash
  end

  pipeline :api do
    plug :accepts, ~w(json)
  end

  scope "/admin", as: :admin do
    pipe_through :admin
    user_routes "/users", Brando.Admin.UserController,
                               private: %{model: Brando.User}
    user_routes "/users2", private: %{model: Brando.User}
    user_routes "/users3"
    post_routes "/news"
    post_routes "/news2", [model: Brando.User]
    post_routes "/news3", Brando.Admin.PostController,
                                [model: Brando.User]
    image_routes "/images"
    image_routes "/images2", [image_model: Brando.Image,
                                 series_model: Brando.ImageSeries,
                                 category_model: Brando.ImageCategory]
    scope "villain" do
      villain_routes Brando.Admin.PostController
    end

    scope "villain2" do
      villain_routes "2", Brando.Admin.PostController
    end

    get "/", Brando.Admin.DashboardController, :dashboard
  end

  scope "/" do
    pipe_through :browser
    get "/login", Brando.SessionController, :login,
      private: %{model: Brando.User,
                 layout: {Brando.Session.LayoutView, "auth.html"}}
    post "/login", Brando.SessionController, :login,
      private: %{model: Brando.User,
                 layout: {Brando.Session.LayoutView, "auth.html"}}
    get "/logout", Brando.SessionController, :logout,
      private: %{model: Brando.User,
                 layout: {Brando.Session.LayoutView, "auth.html"}}
  end
end

defmodule Brando.RoutesTest do
  use ExUnit.Case

  setup do
    routes =
      Phoenix.Router.ConsoleFormatter.format(Brando.TestRouter)
    {:ok, [routes: routes]}
  end

  test "user_routes", %{routes: routes} do
    assert routes =~ "/admin/users/new"
    assert routes =~ "/admin/users/:id/edit"
  end

  test "news_resources", %{routes: routes} do
    assert routes =~ "/admin/news/new"
    assert routes =~ "/admin/news/:id/edit"
  end

  test "image_routes", %{routes: routes} do
    assert routes =~ "/admin/images/categories"
    assert routes =~ "/admin/images/categories/:id/edit"
  end

  test "villain_routes", %{routes: routes} do
    assert routes =~ "/admin/villain/villain/upload"
    assert routes =~ "/admin/villain/villain/browse"
    assert routes =~ "/admin/villain/villain/imagedata"

    assert routes =~ "/admin/villain2/2/villain/upload"
    assert routes =~ "/admin/villain2/2/villain/browse"
    assert routes =~ "/admin/villain2/2/villain/imagedata"
  end
end