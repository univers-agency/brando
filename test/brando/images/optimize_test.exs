defmodule Brando.Image.OptimizeTest do
  use ExUnit.Case
  use Brando.ConnCase
  use Brando.Integration.TestCase
  use Plug.Test
  use RouterHelper

  import Brando.Images.Optimize
  import Brando.Images.Utils

  @fixture "#{Path.expand("../../", __DIR__)}/fixtures/sample.png"

  test "optimize ignores with changeset errors" do
    cs = %Ecto.Changeset{
      action: nil,
      changes: %{image: %{dummy: "dummy"}},
      data: nil,
      params: %{},
      errors: [
        username: "has invalid format",
        email: "has invalid format",
        password: "can't be blank",
        email: "can't be blank",
        full_name: "can't be blank",
        username: "can't be blank"
      ]
    }

    assert optimize(cs, :image) == cs
  end

  test "optimize ignores with no changes" do
    cs = %Ecto.Changeset{
      action: nil,
      changes: %{},
      data: nil,
      params: %{},
      errors: []
    }

    assert optimize(cs, :image) == cs
  end

  test "optimize ignores with missing config" do
    cs = Ecto.Changeset.change(
      %Brando.User{},
      avatar: %Brando.Type.Image{
        credits: nil,
        optimized: false,
        path: "images/default/2ambet.jpg",
        title: nil,
        sizes: %{
          large: "images/default/large/2ambet.jpg",
          medium: "images/default/medium/2ambet.jpg",
          small: "images/default/small/2ambet.jpg",
          thumb: "images/default/thumb/2ambet.jpg",
          xlarge: "images/default/xlarge/2ambet.jpg"
        }
      }
    )

    optimize(image, :image)
    optimized_image = Brando.repo.get(Image, image.id)

    assert optimize(cs, :image) == cs
  end

  test "optimize" do
    File.mkdir_p!(media_path("thumb"))
    File.cp!(@fixture, media_path("sample.png"))
    File.cp!(@fixture, media_path("thumb/sample.png"))

    cs = Ecto.Changeset.change(
      %Brando.User{},
      avatar: %Brando.Type.Image{
        credits: nil,
        optimized: false,
        path: "sample.png",
        title: nil,
        sizes: %{
          thumb: "thumb/sample.png",
        }
      }
    )

    image =
      Image
      |> Brando.repo.all
      |> List.first

    optimize(image, :image)

    optimized_image = Brando.repo.get(Image, image.id)
    refute optimized_image.image.optimized

    assert File.exists?(media_path("portfolio/test-category/test-series/small/sample.jpg"))
    refute File.exists?(media_path("portfolio/test-category/test-series/small/sample-optimized.jpg"))
  end
end
