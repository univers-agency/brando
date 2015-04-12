defmodule Brando.Integration.Migration do
  use Ecto.Migration
  def up do
    create table(:users) do
      add :username,      :text
      add :full_name,     :text
      add :email,         :text
      add :password,      :text
      add :avatar,        :text
      add :role,          :integer
      add :last_login,    :datetime
      timestamps
    end

    create index(:users, [:username], unique: true)
    create index(:users, [:email], unique: true)

    create table(:posts) do
      add :language,          :text
      add :header,            :text
      add :slug,              :text
      add :lead,              :text
      add :data,              :json
      add :html,              :text
      add :cover,             :text
      add :status,            :integer
      add :creator_id,        references(:users)
      add :meta_description,  :text
      add :meta_keywords,     :text
      add :featured,          :boolean
      add :published,         :boolean
      add :publish_at,        :datetime
      timestamps
    end

    create index(:posts, [:language])
    create index(:posts, [:slug])
    create index(:posts, [:status])
  end

  def down do
    drop table(:users)
    drop index(:users, [:username], unique: true)
    drop index(:users, [:email], unique: true)

    drop table(:posts)
    drop index(:posts, [:language])
    drop index(:posts, [:slug])
    drop index(:posts, [:status])
  end
end