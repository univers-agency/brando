defmodule Brando.Migrations.RenameTemplatesToModules do
  use Ecto.Migration
  import Ecto.Query

  def change do
    villain_schemas = Brando.Villain.list_villains()

    actions =
      for {schema, fields} <- villain_schemas do
        Enum.map(fields, fn {_, f, _} ->
          from t in schema.__schema__(:source),
            update: [set: [{^f, fragment("REPLACE(?::text, '\"type\": \"template\"', '\"type\": \"module\"')::jsonb", field(t, ^f))}]]
        end)
      end
      |> List.flatten()

    for action <- actions do
      Brando.repo().update_all(action, [])
    end

    flush()

    rename table(:pages_templates), to: table(:pages_modules)
  end
end
