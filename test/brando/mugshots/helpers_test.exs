defmodule Brando.Mugshots.HelpersTest do
  use ExUnit.Case
  import Brando.Mugshots.Helpers

  test "img/2" do
    assert img("images/file.jpg", :thumb) == "images/thumb/file.jpg"
    assert img("file.jpg", :thumb) == "thumb/file.jpg"
    assert img("space dir/f.jpg", :thumb) == "space dir/thumb/f.jpg"
  end
end