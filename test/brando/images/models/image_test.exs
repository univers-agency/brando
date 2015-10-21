defmodule Brando.Integration.ImageTest do
  use ExUnit.Case
  use Brando.ConnCase
  use Brando.Integration.TestCase
  alias Brando.Image
  alias Brando.ImageSeries
  alias Brando.ImageCategory
  alias Brando.Type.ImageConfig

  @params %{sequence: 0, image: %{title: "Title", credits: "credits",
            path: "/tmp/path/to/fake/image.jpg",
            sizes: %{small: "/tmp/path/to/fake/image.jpg",
            thumb: "/tmp/path/to/fake/thumb.jpg"}}}
  @params2 %{sequence: 1, image: %{title: "Title2", credits: "credits2",
             path: "/tmp/path/to/fake/image2.jpg",
             sizes: %{small: "/tmp/path/to/fake/image2.jpg",
             thumb: "/tmp/path/to/fake/thumb2.jpg"}}}
  @series_params %{name: "Series name", slug: "series-name",
                   credits: "Credits", sequence: 0, creator_id: 1}
  @category_params %{cfg: %ImageConfig{}, creator_id: 1,
                     name: "Test Category", slug: "test-category"}

  setup do
    user = Forge.saved_user(TestRepo)
    {:ok, category} =
      @category_params
      |> Map.put(:creator_id, user.id)
      |> ImageCategory.create(user)
    {:ok, series} =
      @series_params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_category_id, category.id)
      |> ImageSeries.create(user)
    {:ok, %{user: user, category: category, series: series}}
  end

  test "create/2", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert image.creator_id == user.id
    assert image.image_series_id == series.id
  end

  test "create/2 bad params", %{user: user} do
    assert {:error, errors} =
      @params |> Image.create(user)

    assert errors == [image_series_id: "can't be blank"]
  end

  test "update/2", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert image.creator_id == user.id
    assert image.image_series_id == series.id
    assert image.sequence == 0

    assert {:ok, image} = image |> Image.update(%{"sequence" => 4})
    assert image.sequence == 4
  end

  test "update/2 bad params", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert image.creator_id == user.id
    assert image.image_series_id == series.id
    assert image.sequence == 0

    assert {:error, errors} = image |> Image.update(%{"sequence" => "string"})
    assert errors == [sequence: "is invalid"]
  end

  test "update_image_meta/3", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert image.image.title == "Title"
    assert image.image.credits == "credits"

    assert {:ok, new_image} =
      Image.update_image_meta(image, "new title", "new credits")

    refute new_image.image == image.image
    assert new_image.image.title == "new title"
    assert new_image.image.credits == "new credits"
  end

  test "get/1", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert (Image |> Brando.repo.get_by!(id: image.id)).id
           == image.id
    assert (Image |> Brando.repo.get_by!(id: image.id)).creator_id
           == image.creator_id
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: 1234)
    end
  end

  test "get!/1", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image.id)).id
           == image.id
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: 1234)
    end
  end

  test "sequence/2", %{user: user, series: series} do
    assert {:ok, image1} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert {:ok, image2} =
      @params2
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)

    assert image1.sequence == 0
    assert image2.sequence == 1

    assert {:ok, _} = Image.sequence([to_string(image1.id),
                                     to_string(image2.id)], [1, 0])

    image1 = Image |> Brando.repo.get_by!(id: image1.id)
    image2 = Image |> Brando.repo.get_by!(id: image2.id)
    assert image1.sequence == 1
    assert image2.sequence == 0
  end

  test "delete/1", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image.id)).id == image.id
    assert Image.delete(image)
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: image.id)
    end

    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image.id)).id == image.id
    assert Image.delete(image.id)
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: image.id)
    end

    assert {:ok, image1} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert {:ok, image2} =
      @params2
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image1.id)).id == image1.id
    assert (Image |> Brando.repo.get_by!(id: image2.id)).id == image2.id
    assert Image.delete([image1.id, image2.id])
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: image1.id)
    end
    assert_raise Ecto.NoResultsError, fn ->
      Image |> Brando.repo.get_by!(id: image2.id)
    end
  end

  test "delete_dependent_images/1", %{user: user, series: series} do
    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image.id)).id == image.id

    assert {:ok, image} =
      @params
      |> Map.put(:creator_id, user.id)
      |> Map.put(:image_series_id, series.id)
      |> Image.create(user)
    assert (Image |> Brando.repo.get_by!(id: image.id)).id == image.id

    series =
      ImageSeries
      |> Ecto.Query.preload([:images])
      |> Brando.repo.get_by!(id: series.id)
      |> Brando.repo.preload(:images)

    assert Enum.count(series.images) == 2
    Image.delete_dependent_images(series.id)

    series =
      ImageSeries
      |> Ecto.Query.preload([:images])
      |> Brando.repo.get_by!(id: series.id)
      |> Brando.repo.preload(:images)

    assert Enum.count(series.images) == 0
  end
end