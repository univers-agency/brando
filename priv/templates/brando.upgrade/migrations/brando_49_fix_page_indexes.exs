defmodule Brando.Repo.Migrations.FixPageIndexes do
  use Ecto.Migration

  def change do
    create index(:pages_pages, [:uri])
    drop unique_index(:pages_pages, [:key, :language])
    create unique_index(:pages_pages, [:uri, :language])
  end
end
