defmodule Brando.Images.Utils do
  @moduledoc """
  General utilities pertaining to the Images module
  """

  import Brando.Utils

  @doc """
  Goes through `image`, which is a model with a :sizes field
  then passing to `delete_media/2` for removal

  ## Example:

      delete_original_and_sized_images(record.cover)

  """
  def delete_original_and_sized_images(nil) do
    nil
  end
  def delete_original_and_sized_images(image) do
    delete_sized_images(image)
    delete_media(Map.get(image, :path))
  end

  @doc """
  Delete sizes associated with `image`, but keep original.
  """
  def delete_sized_images(nil) do
    nil
  end
  def delete_sized_images(image) do
    sizes = Map.get(image, :sizes)
    for {_size, file} <- sizes do
      delete_media(file)
    end
  end

  @doc """
  Deletes `file` after joining it with `media_path`
  """
  def delete_media(nil), do: nil
  def delete_media(""), do: nil
  def delete_media(file) do
    file = Path.join([Brando.config(:media_path), file])
    File.rm(file)
  end

  @doc """
  Splits `file` with `split_path/1`, adds `size` to the path before
  concatenating it with the filename.

  ## Example

      iex> size_dir("test/dir/filename.jpg", :thumb)
      "test/dir/thumb/filename.jpg"

  """
  def size_dir(file, size) when is_binary(size) do
    {path, filename} = split_path(file)
    Path.join([path, size, filename])
  end

  def size_dir(file, size) when is_atom(size) do
    {path, filename} = split_path(file)
    Path.join([path, Atom.to_string(size), filename])
  end

  @doc """
  Returns image type atom.
  """
  def image_type(%Brando.Type.Image{path: filename}) do
    case String.downcase(Path.extname(filename)) do
      ".jpg" -> :jpeg
      ".jpeg" -> :jpeg
      ".png" -> :png
      ".gif" -> :gif
    end
  end

  @doc """
  Return joined path of `file` and the :media_path config option
  as set in your app's config.exs.
  """
  def media_path() do
    Brando.config(:media_path)
  end
  def media_path(nil) do
    Brando.config(:media_path)
  end
  def media_path(file) do
    Path.join([Brando.config(:media_path), file])
  end

  @doc """
  Add `-optimized` between basename and ext of `file`.
  """
  def optimized_filename(file) do
    {path, filename} = split_path(file)
    {basename, ext} = split_filename(filename)
    Path.join([path, "#{basename}-optimized#{ext}"])
  end

  @doc """
  Creates sized images.
  """
  def create_image_sizes({%{uploaded_file: file}, cfg}) do
    {file_path, filename} = split_path(file)
    upload_path = Map.get(cfg, :upload_path)

    sizes = for {size_name, size_cfg} <- Map.get(cfg, :sizes) do
      size_dir = Path.join([file_path, to_string(size_name)])
      sized_image = Path.join([size_dir, filename])
      sized_path = Path.join([upload_path, to_string(size_name), filename])

      File.mkdir_p(size_dir)
      create_image_size(file, sized_image, size_cfg)
      {size_name, sized_path}
    end

    size_struct =
      %Brando.Type.Image{}
      |> Map.put(:sizes, Enum.into(sizes, %{}))
      |> Map.put(:path, Path.join([upload_path, filename]))

    {:ok, size_struct}
  end

  @doc """
  Creates a sized version of `image_src`.
  """
  def create_image_size(image_src, image_dest, size_cfg) do
    modifier = String.ends_with?(size_cfg["size"], ~w(< > ^ % ! @)) && "" || "^"
    fill = size_cfg["fill"] && "-background #{size_cfg["fill"]} " || ""
    crop_string = "#{size_cfg["size"]}#{modifier} " <>
                  "#{fill}-gravity center -extent #{size_cfg["size"]}"

    if size_cfg["crop"] do
      image_src
      |> Mogrify.open
      |> Mogrify.copy
      |> Mogrify.resize(crop_string)
      |> Mogrify.save(image_dest)
    else
      image_src
      |> Mogrify.open
      |> Mogrify.copy
      |> Mogrify.resize(size_cfg["size"])
      |> Mogrify.save(image_dest)
    end
  end
end