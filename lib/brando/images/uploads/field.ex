defmodule Brando.Images.Upload.Field do
  @moduledoc """
  Handles uploads of image fields

  For schemas, see Brando.Images.Uploads.Schema
  """

  @type image_config :: Brando.Type.ImageConfig.t()
  @type image_type :: Brando.Type.Image.t()
  @type user :: Brando.Users.User.t() | :system

  alias Brando.Images
  alias Brando.Upload

  @doc """
  Handles the upload by starting a chain of operations on the plug.
  This function handles upload when we have an image field on a schema,
  not when the schema itself represents an image. (See Brando.Images.Upload.Schema)

  ## Parameters

    * `name`: the field we are operating on.
    * `upload_params`: a %Brand.Upload{} struct.
    * `cfg`: the field's cfg from has_image_field

  """
  @spec handle_upload(
          field_name :: atom | binary,
          upload_params :: any(),
          cfg :: image_config,
          user :: any()
        ) :: {:ok, {:handled, atom, image_type}} | {:error, any}
  def handle_upload(name, upload_params, cfg, user) do
    name = (is_binary(name) && String.to_existing_atom(name)) || name

    with {:ok, upload} <- Upload.process_upload(upload_params.file, cfg),
         {:ok, image_struct} <-
           Images.Processing.create_image_type_struct(upload, user, upload_params),
         {:ok, operations} <- Images.Operations.create(image_struct, cfg, nil, user),
         {:ok, results} <- Images.Operations.perform(operations, user) do
      image_struct =
        results
        |> List.first()
        |> Map.get(:image_struct)

      {:ok, {:handled, name, image_struct}}
    else
      err ->
        {:error, {name, Upload.handle_upload_error(err)}}
    end
  end
end
