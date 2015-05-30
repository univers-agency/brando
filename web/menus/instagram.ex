defmodule Brando.Menu.Instagram do
  @moduledoc """
  Menu definitions for the Instagram Menu. See `Brando.Menu` docs for
  more information
  """
  use Brando.Menu

  menu "Instagram",
    %{name: "Instagram", anchor: "instagram", icon: "fa fa-instagram icon",
      submenu: [%{name: "Oversikt", url: {:admin_instagram_path, :index}}]}

end