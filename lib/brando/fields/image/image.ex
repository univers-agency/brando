defmodule Brando.Field.Image.Schema do
  @moduledoc """
  Assign a schema's field as an image field.

  This means you can configure the field with different sizes that will be
  automatically created on file upload.

  ## Example

  In your `my_schema.ex`:

      has_image_field :avatar,
        %{allowed_exts: ["jpg", "jpeg", "png"],
         default_size: :medium,
         random_filename: true,
         upload_path: Path.join("images", "default"),
         size_limit: 10_240_000,
         target_format: :jpg,
         sizes: %{
           "thumb" =>  %{"size" => "150x150", "quality" => 100, "crop" => true},
           "small" =>  %{"size" => "300x", "quality" => 100},
           "large" =>  %{"size" => "700x", "quality" => 10},
        }
      }

  """
  import Ecto.Changeset

  defmacro __using__(_) do
    quote do
      Module.register_attribute(__MODULE__, :imagefields, accumulate: true)
      alias Brando.Images
      import Brando.Images.Utils
      import Brando.Upload
      import Ecto.Changeset
      import unquote(__MODULE__)
      @before_compile unquote(__MODULE__)

      @doc """
      Cleans up old images on update
      """
      defmacro cleanup_old_images(_) do
        raise "cleanup_old_images() should not be used in changesets anymore, just remove it."
      end

      def cleanup_old_images(changeset, :safe) do
        imagefield_keys = Keyword.keys(__imagefields__())

        for key <- Map.keys(changeset.changes) do
          if key in imagefield_keys do
            delete_original_and_sized_images(changeset.data, key)
          end
        end

        changeset
      end

      @doc """
      Validates upload in changeset
      """
      def validate_upload(changeset, {:image, field_name}, user) do
        do_validate_upload(changeset, {:image, field_name}, user)
      end

      def validate_upload(changeset, {:image, field_name}) do
        do_validate_upload(changeset, {:image, field_name}, :system)
      end

      defp do_validate_upload(changeset, {:image, field_name}, user) do
        with {:ok, {:upload, changeset}} <- merge_focal(changeset, field_name),
             {:ok, plug} <- Brando.Utils.field_has_changed(changeset, field_name),
             {:ok, _} <- Brando.Utils.changeset_has_no_errors(changeset),
             {:ok, cfg} <- get_image_cfg(field_name),
             {:ok, {:handled, name, field}} <-
               Images.Upload.Field.handle_upload(field_name, plug, cfg, user) do
          cleanup_old_images(changeset, :safe)
          put_change(changeset, name, field)
        else
          :unchanged ->
            changeset

          :has_errors ->
            changeset

          {:ok, {:focal_changed, changeset}} ->
            {:ok, changeset} =
              Images.Processing.recreate_sizes_for_image_field_record(changeset, field_name, user)

            changeset

          {:ok, {:focal_unchanged, changeset}} ->
            changeset

          {:error, {name, {:error, error_msg}}} ->
            add_error(changeset, name, error_msg)

          {:ok, {:unhandled, name, field}} ->
            changeset
        end
      end
    end
  end

  @doc false
  defmacro __before_compile__(env) do
    imagefields = Module.get_attribute(env.module, :imagefields)
    compile(imagefields)
  end

  @doc false
  def compile(imagefields) do
    imagefields_src = for {name, contents} <- imagefields, do: defcfg(name, contents)

    quote do
      def __imagefields__ do
        unquote(Macro.escape(imagefields))
      end

      unquote(imagefields_src)
    end
  end

  defp defcfg(name, cfg) do
    escaped_contents = Macro.escape(cfg)

    quote do
      @doc """
      Get `field_name`'s image field configuration
      """
      def get_image_cfg(field_name) when field_name == unquote(name),
        do: {:ok, unquote(escaped_contents)}
    end
  end

  @doc """
  Set the form's `field_name` as being an image_field, and store
  it to the module's @imagefields.

  Converts the `opts` map to an ImageConfig struct.

  ## Options

    * `allowed_exts`:
      A list of allowed image extensions.
      Example: `["jpg", "jpeg", "png"]`
    * `default_size`:
      If no size is provided to the image helpers, use this size.
      Example: `:medium`
    * random_filename
    * `upload_path`:
      The path used when uploading. This is appended to the base
      `priv/media` directory.
      Example: `Path.join("images", "default")`
    * `size_limit`:
      Enforce a size limit when uploading images.
      Example: `10_240_000`
    * `sizes`:
      A list of different sizes to be created. Each list entry needs a
      list with `size`, `quality` and optional `crop` keys.
      Example:
         sizes: [
           thumb:  [size: "150x150", quality: 100, crop: true],
           small:  [size: "300x",    quality: 100],
           large:  [size: "700x",    quality: 100]
        ]

  """
  defmacro has_image_field(field_name, opts) do
    quote do
      imagefields = Module.get_attribute(__MODULE__, :imagefields)
      cfg_struct = struct!(%Brando.Type.ImageConfig{}, unquote(opts))

      Module.put_attribute(__MODULE__, :imagefields, {unquote(field_name), cfg_struct})
    end
  end

  @spec merge_focal(changeset :: Ecto.Changeset.t(), field_name :: atom) ::
          {:ok, {:focal_changed, Ecto.Changeset.t()}}
          | {:ok, {:focal_unchanged, Ecto.Changeset.t()}}
          | {:ok, {:upload, Ecto.Changeset.t()}}
  def merge_focal(changeset, field_name) do
    case get_field(changeset, field_name) do
      %Brando.Type.Focal{focal: focal} ->
        # Merge focal with the cs
        do_merge_focal(changeset, field_name, focal)

      _ ->
        {:ok, {:upload, changeset}}
    end
  end

  defp do_merge_focal(changeset, field_name, focal) do
    case Map.get(changeset.data, field_name, nil) do
      nil ->
        # nothing in data, return regular changeset
        {:ok, {:upload, changeset}}

      img ->
        put_or_delete_change(changeset, field_name, img, focal)
    end
  end

  defp put_or_delete_change(changeset, field_name, img, focal) do
    case Map.equal?(img.focal, focal) do
      true ->
        # nothing changed, delete change
        changeset = delete_change(changeset, field_name)
        {:ok, {:focal_unchanged, changeset}}

      false ->
        changeset = put_change(changeset, field_name, Map.put(img, :focal, focal))
        {:ok, {:focal_changed, changeset}}
    end
  end

  @doc """
  List all registered image fields
  """
  def list_image_fields do
    app_modules = Application.spec(Brando.otp_app(), :modules)
    modules = app_modules

    modules
    |> Enum.filter(&({:__imagefields__, 0} in &1.__info__(:functions)))
    |> Enum.map(fn module ->
      %{
        source: module.__schema__(:source),
        fields: module.__imagefields__() |> Keyword.keys()
      }
    end)
  end

  def generate_image_fields_migration do
    img_fields = list_image_fields()

    Enum.map(img_fields, fn %{source: source, fields: fields} ->
      Enum.map(fields, fn field ->
        ~s(
          execute """
          alter table #{source} alter column #{field} type jsonb using #{field}::JSON
          """
          )
      end)
      |> Enum.join("\n")
    end)
    |> Enum.join("\n")
  end
end