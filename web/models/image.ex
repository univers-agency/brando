defmodule Brando.Image do
  @moduledoc """
  Ecto schema for the Image model
  and helper functions for dealing with the model.
  """

  @type t :: %__MODULE__{}

  use Brando.Web, :model
  use Brando.Images.Upload
  use Brando.Sequence, :model

  alias Brando.User
  alias Brando.ImageSeries

  import Brando.Gettext
  import Brando.Utils.Model, only: [put_creator: 2]
  import Ecto.Query, only: [from: 2]
  import Brando.Images.Utils

  @required_fields ~w(image image_series_id)
  @optional_fields ~w(sequence creator_id)

  schema "images" do
    field :image, Brando.Type.Image
    belongs_to :creator, User
    belongs_to :image_series, ImageSeries
    sequenced
    timestamps
  end

  @doc """
  Casts and validates `params` against `model` to create a valid
  changeset when action is :create.

  ## Example

      model_changeset = changeset(%__MODULE__{}, :create, params)

  """
  @spec changeset(t, atom, Keyword.t | Options.t) :: t
  def changeset(model, :create, params) do
    model
    |> cast(params, @required_fields, @optional_fields)
  end

  @doc """
  Casts and validates `params` against `model` to create a valid
  changeset when action is :update.

  ## Example

      model_changeset = changeset(%__MODULE__{}, :update, params)

  """
  @spec changeset(t, atom, %{binary => term} | %{atom => term}) :: t
  def changeset(model, :update, params) do
    model
    |> cast(params, [], @required_fields ++ @optional_fields)
  end

  @doc """
  Create a changeset for the model by passing `params`.
  If valid, generate a hashed password and insert model to Brando.repo.
  If not valid, return errors from changeset
  """
  @spec update(%{binary => term} | %{atom => term}, User.t)
        :: {:ok, t} | {:error, Keyword.t}
  def create(params, current_user) do
    model_changeset =
      %__MODULE__{}
      |> put_creator(current_user)
      |> changeset(:create, params)
    case model_changeset.valid? do
      true  -> {:ok, Brando.repo.insert!(model_changeset)}
      false -> {:error, model_changeset.errors}
    end
  end

  @doc """
  Create an `update` changeset for the model by passing `params`.
  If password is in changeset, hash and insert in changeset.
  If valid, update model in Brando.repo.
  If not valid, return errors from changeset
  """
  @spec update(t, %{binary => term} | %{atom => term})
        :: {:ok, t} | {:error, Keyword.t}
  def update(model, params) do
    model_changeset = changeset(model, :update, params)
    case model_changeset.valid? do
      true ->  {:ok, Brando.repo.update!(model_changeset)}
      false -> {:error, model_changeset.errors}
    end
  end

  @doc """
  Updates the `model`'s image JSON field with `title` and `credits`
  """
  def update_image_meta(model, title, credits) do
    image =
      model.image
      |> Map.put(:title, title)
      |> Map.put(:credits, credits)

    model_changeset = model |> changeset(:update, %{"image" => image})
    case model_changeset.valid? do
      true ->  {:ok, Brando.repo.update!(model_changeset)}
      false -> {:error, model_changeset.errors}
    end
  end

  @doc """
  Get all images in series `id`.
  """
  def for_series_id(id) do
    q = from m in __MODULE__,
             where: m.image_series_id == ^id,
             order_by: m.sequence
    Brando.repo.all(q)
  end

  @doc """
  Delete `record` from database

  Also deletes all dependent image sizes.
  """
  def delete(ids) when is_list(ids) do
    q = from m in __MODULE__,
             where: m.id in ^ids
    records = Brando.repo.all(q)
    for record <- records do
      delete_original_and_sized_images(record.image)
    end
    Brando.repo.delete_all(q)
  end

  def delete(record) when is_map(record) do
    delete_original_and_sized_images(record.image)
    Brando.repo.delete!(record)
  end

  def delete(id) do
    record = Brando.repo.get_by!(__MODULE__, id: id)
    delete(record)
  end

  @doc """
  Deletes all image's sizes and recreates them.
  """
  def recreate_sizes(record) do
    record = Brando.repo.preload(record, :image_series)
    delete_sized_images(record.image)

    full_path = media_path(record.image.path)

    {:ok, new_image} =
      create_image_sizes({%{uploaded_file: full_path}, record.image_series.cfg})

    new_sizes = new_image.sizes

    image =
      record.image
      |> Map.put(:sizes, new_sizes)

    record
    |> Map.put(:image, image)
    |> Brando.repo.update!
  end

  @doc """
  Delete all images depending on imageserie `series_id`
  """
  def delete_dependent_images(series_id) do
    q = from m in __MODULE__,
             where: m.image_series_id == ^series_id
    images = Brando.repo.all(q)

    for img <- images do
      delete(img)
    end
  end

  #
  # Meta

  use Brando.Meta.Model, [
    singular: gettext("image"),
    plural: gettext("images"),
    repr: &("#{&1.id} | #{&1.image.path}"),
    fields: [
      id: gettext("ID"),
      image: gettext("Image"),
      sequence: gettext("Sequence"),
      creator: gettext("Creator"),
      image_series: gettext("Image series"),
      inserted_at: gettext("Inserted at"),
      updated_at: gettext("Updated at")
    ],
  ]
end