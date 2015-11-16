# :erlang.system_flag(:backtrace_depth, 1000)
ExUnit.start

# Clear tmp dir
File.rm_rf!(Path.join([Mix.Project.app_path, "tmp", "media"]))
File.mkdir_p!(Path.join([Mix.Project.app_path, "tmp", "media"]))

# Basic test repo
alias Brando.Integration.TestRepo, as: Repo

defmodule Brando.Integration.Repo do
  defmacro __using__(opts) do
    quote do
      use Ecto.Repo, unquote(opts)
      def log(cmd) do
        super(cmd)
        on_log = Process.delete(:on_log) || fn -> :ok end
        on_log.()
      end
    end
  end
end

defmodule Brando.Integration.TestRepo do
  use Brando.Integration.Repo, otp_app: :brando
end

defmodule Brando.Integration.Endpoint do
  use Phoenix.Endpoint,
    otp_app: :brando

  plug Plug.Session,
    store: :cookie,
    key: "_test",
    signing_salt: "signingsalt"

  plug Plug.Static,
    at: "/", from: :brando, gzip: false,
    only: ~w(css images js fonts favicon.ico robots.txt),
    cache_control_for_vsn_requests: nil,
    cache_control_for_etags: nil

  socket "/admin/ws", Brando.Integration.UserSocket
end

defmodule Brando.Integration.UserSocket do
  use Phoenix.Socket

  ## Channels
  channel "system:*", Brando.SystemChannel
  channel "stats", Brando.StatsChannel

  ## Transports
  transport :websocket, Phoenix.Transports.WebSocket
  transport :longpoll, Phoenix.Transports.LongPoll

  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  #  To deny connection, return `:error`.
  def connect(%{"token" => token}, socket) do
    case Phoenix.Token.verify(socket, "user", token, max_age: 1209600) do
      {:ok, user_id} ->
        {:ok, assign(socket, :user, user_id)}
      {:error, _} ->
        :error
    end
  end

  def connect(_params, socket) do
    {:ok, socket}
  end

  def id(_socket), do: nil
end

Code.require_file "support/instagram_helper.exs", __DIR__

defmodule Brando.Integration.TestCase do
  use ExUnit.CaseTemplate

  using do
    quote do
      require Repo
      import Ecto.Query
      alias Ecto.Integration.TestRepo, as: Repo
    end
  end
end

defmodule Forge do
  use Blacksmith

  @save_one_function &Blacksmith.Config.save/2
  @save_all_function &Blacksmith.Config.save_all/2

  register :user,
    __struct__: Brando.User,
    full_name: "James Williamson",
    email: "james@thestooges.com",
    password: "hunter2hunter2",
    username: "jamesw",
    avatar: nil,
    role: [:admin, :superuser],
    language: "en"

  register :user_w_hashed_pass,
    __struct__: Brando.User,
    full_name: "James Williamson",
    email: "james@thestooges.com",
    password: "$2b$12$VD9opg289oNQAHii8VVpoOIOe.y4kx7.lGb9SYRwscByP.tRtJTsa",
    username: "jamesw",
    avatar: nil,
    role: [:admin, :superuser],
    language: "en"

  register :page,
    __struct__: Brando.Page,
    key: "key/path",
    language: "en",
    title: "Page title",
    slug: "page-title",
    data: ~s([{"type":"text","data":{"text":"Text in p.","type":"paragraph"}}]),
    html: ~s(<p>Text in p.</p>),
    status: :published,
    css_classes: "extra-class"
end

defmodule Blacksmith.Config do
  def save(repo, map) do
    repo.insert!(map)
  end

  def save_all(repo, list) do
    Enum.map(list, &repo.insert!/1)
  end
end

Code.require_file "support/migrations.exs", __DIR__

_   = Ecto.Storage.down(Repo)
:ok = Ecto.Storage.up(Repo)
{:ok, _pid} = Repo.start_link
:ok = Ecto.Migrator.up(Repo, 0, Brando.Integration.Migration, log: false)

Ecto.Adapters.SQL.begin_test_transaction(Brando.Integration.TestRepo)
Brando.endpoint.start_link
