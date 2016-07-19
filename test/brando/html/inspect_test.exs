defmodule Brando.HTML.InspectTest do
  use ExUnit.Case
  use Brando.ConnCase
  use Brando.Integration.TestCase
  import Brando.HTML.Inspect
  alias Brando.Type
  alias Brando.Factory

  @association_has %Ecto.Association.Has{
    related: Brando.Image,
    related_key: :image_series_id, cardinality: :many,
    field: :images,
    owner: Brando.ImageSeries,
    owner_key: :id,
    queryable: Brando.Image
  }

  @association_val [
    %Brando.Image{
      __meta__: %Ecto.Schema.Metadata{
        source: "images",
        state: :loaded
      },
      creator_id: 1,
      id: 74,
      image: %Brando.Type.Image{credits: nil, optimized: false,
        path: "images/default/2ambet.jpg",
        sizes: %{large: "images/default/large/2ambet.jpg",
        medium: "images/default/medium/2ambet.jpg",
        small: "images/default/small/2ambet.jpg",
        thumb: "images/default/thumb/2ambet.jpg",
        xlarge: "images/default/xlarge/2ambet.jpg"}, title: nil},
        image_series_id: 2,
        inserted_at: %Ecto.DateTime{
          day: 3, hour: 14, min: 18, month: 4,
          sec: 32, usec: 0, year: 2015
        },
        sequence: 0,
        updated_at: %Ecto.DateTime{
          day: 3, hour: 14, min: 18, month: 4,
          sec: 32, usec: 0, year: 2015
        }
      },
      %Brando.Image{
        __meta__: %Ecto.Schema.Metadata{source: "images", state: :loaded},
        creator_id: 1,
        id: 67,
        image: %Brando.Type.Image{
          credits: nil,
          optimized: false,
          path: "images/default/e9anl.jpg",
          sizes: %{
            large: "images/default/large/e9anl.jpg",
            medium: "images/default/medium/e9anl.jpg",
            small: "images/default/small/e9anl.jpg",
            thumb: "images/default/thumb/e9anl.jpg",
            xlarge: "images/default/xlarge/e9anl.jpg"
          },
          title: nil
        },
        image_series_id: 2,
        inserted_at: %Ecto.DateTime{
          day: 3, hour: 14, min: 14, month: 4,
          sec: 58, usec: 0, year: 2015
        },
        sequence: 1,
        updated_at: %Ecto.DateTime{
          day: 3, hour: 14, min: 14, month: 4,
          sec: 58, usec: 0, year: 2015
        }
      }
    ]

  test "model/1" do
    user = Factory.insert(:user)
    # assert {:ok, user} = create_user(@user_params)

    {:safe, ret} = model(user)
    ret = IO.iodata_to_binary(ret)

    assert ret =~ "jamesw"
    assert ret =~ "James Williamson"
    assert ret =~ "/media/images/avatars/thumb/27i97a.jpeg"
    assert ret =~ "superuser"
  end

  test "inspect_field/3" do
    image_type = Factory.build(:image_type)

    assert inspect_field("name", Type.ImageConfig, "value") == ~s(<em>Configuration data</em>)
    assert inspect_field("name", Type.Image, image_type) =~ "/media/images/default/thumb/sample.png"
    assert inspect_field(:password, :string, "passord") =~ "censored"
    assert inspect_field("name", :string, "") =~ "No value"

    assert inspect_field("date", Ecto.Date, nil) =~ "No value"
    assert inspect_field("date", Ecto.Date, %Ecto.Date{year: 2015, month: 12, day: 1}) =~ "1/12/2015"

    assert inspect_field("status", Type.Status, :published) =~ "Published"
    assert inspect_field("status", Type.Status, :pending) =~ "Pending"
    assert inspect_field("status", Type.Status, :draft) =~ "Draft"
    assert inspect_field("status", Type.Status, :deleted) =~ "Deleted"

    assert inspect_field(:key, :string, "test/path") == "<strong>test</strong>/path"
    assert inspect_field(:key, :string, "test") == "<strong>test</strong>"

    assert inspect_field("name", :boolean, :true) =~ "fa-check"
    assert inspect_field("name", :boolean, nil) =~ "fa-times"
    assert inspect_field("name", :boolean, :false) =~ "fa-times"

    assert inspect_field("name", nil, %Brando.User{username: "Test"}) =~ "micro-avatar"
  end

  test "inspect_assoc/3" do
    assert inspect_assoc("name", %Ecto.Association.Has{}, %Ecto.Association.NotLoaded{})
           =~ "Association not fetched"
    assert inspect_assoc("name", %Ecto.Association.Has{}, [])
           =~ "Empty association"
    assert inspect_assoc("name", @association_has, @association_val)
           =~ "74 | images/default/2ambet.jpg"
  end

  test "model_repr/1" do
    user = Factory.insert(:user)
    assert schema_repr(user) == "James Williamson (jamesw)"
  end

  test "model_name/2" do
    user = Factory.insert(:user)
    assert schema_name(user, :singular) == "user"
    assert schema_name(user, :plural) == "users"
  end
end
