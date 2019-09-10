use Mix.Config

# For production, we configure the host to read the PORT
# from the system environment. Therefore, you will need
# to set PORT=80 before running your server.
#
# You should also configure the url host to something
# meaningful, we use this information when generating URLs.
#
# Finally, we also include the path to a manifest
# containing the digested version of static files. This
# manifest is generated by the mix phoenix.digest task
# which you typically run after static files are built.
config :<%= application_name %>, <%= application_module %>Web.Endpoint,
  http: [:inet6, port: {:system, "PORT"}],
  url: [scheme: "https", host: "sitename.no", port: 80],
  # force_ssl: [rewrite_on: [:x_forwarded_proto]],
  check_origin: ["//sitename.no", "//*.sitename.no",
                 "//*.univers.agency", "//localhost:4000"],
  server: true,
  render_errors: [accepts: ~w(html json), view: Brando.ErrorView, default_format: "html"],
  cache_static_manifest: "priv/static/cache_manifest.json"

config :<%= application_name %>, hmr: false

# Do not print debug messages in production
config :logger, level: :error

# Path to your media directory.
config :brando, media_path: "./media"

# Path to your log directory.
config :brando, log_dir: "./log"

# Show breakpoint debug in frontend
config :brando, show_breakpoint_debug: false

# ## SSL Support
#
# To get SSL working, you will need to add the `https` key
# to the previous section and set your `:url` port to 443:
#
#     config :<%= application_name %>, <%= application_module %>Web.Endpoint,
#       ...
#       url: [host: "example.com", port: 443],
#       https: [:inet6, port: 443,
#               keyfile: System.get_env("SOME_APP_SSL_KEY_PATH"),
#               certfile: System.get_env("SOME_APP_SSL_CERT_PATH")]
#
# Where those two env variables return an absolute path to
# the key and cert in disk or a relative path inside priv,
# for example "priv/ssl/server.key".
#
# We also recommend setting `force_ssl`, ensuring no data is
# ever sent via http, always redirecting to https:
#
#     config :<%= application_name %>, <%= application_module %>Web.Endpoint,
#       force_ssl: [hsts: true]
#
# Check `Plug.SSL` for all available options in `force_ssl`.

# ## Using releases
#
# If you are doing OTP releases, you need to instruct Phoenix
# to start the server for all endpoints:
#
#     config :phoenix, :serve_endpoints, true
#
# Alternatively, you can configure exactly which server to
# start per endpoint:
#
#     config :<%= application_name %>, <%= application_module %>Web.Endpoint,
#       server: true
#

# Finally import the config/prod.secret.exs
# which should be versioned separately.
import_config "prod.secret.exs"
