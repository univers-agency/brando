<template>
  <article>
    <ContentHeader>
      <template v-slot:title>
        {{ $t('<%= vue_plural %>.title') }}
      </template>
      <template v-slot:subtitle>
        {{ $t('<%= vue_plural %>.new') }}
      </template>
    </ContentHeader>
    <<%= Recase.to_pascal(vue_singular) %>Form
      :<%= vue_singular %>="<%= vue_singular %>"
      :save="save" />
  </article>
</template>

<script>

import gql from 'graphql-tag'
import <%= Recase.to_pascal(vue_singular) %>Form from './<%= Recase.to_pascal(vue_singular) %>Form'
import locale from '../../locales/<%= vue_plural %>'

export default {
  components: {
    <%= Recase.to_pascal(vue_singular) %>Form
  },

  data () {
    return {
      <%= vue_singular %>: {
        <%= if status do %>status: 'draft'<% end%>
      }
    }
  },

  methods: {
    async save (setLoader) {
      setLoader(true)
      const <%= vue_singular %>Params = this.$utils.stripParams(this.<%= vue_singular %>, ['__typename', 'id', 'insertedAt', 'updatedAt', 'deletedAt'])
      <%= if img_fields != [] do %>this.$utils.validateImageParams(<%= vue_singular %>Params, <%= img_fields |> Enum.map(&(to_charlist(Recase.to_camel(to_string(elem(&1, 1)))))) |> inspect %>)<% end %>
      <%= if file_fields != [] do %>this.$utils.validateFileParams(<%= vue_singular %>Params, <%= file_fields |> Enum.map(&(to_charlist(Recase.to_camel(to_string(elem(&1, 1)))))) |> inspect %>)<% end %>
      <%= if villain_fields != [] do %>this.$utils.serializeParams(<%= vue_singular %>Params, <%= villain_fields |> Enum.map(&(to_charlist(Recase.to_camel(to_string(elem(&1, 1)))))) |> inspect %>)<% end %>

      try {
        await this.$apollo.mutate({
          mutation: gql`
            mutation Create<%= Recase.to_pascal(vue_singular) %>($<%= vue_singular %>Params: <%= Recase.to_pascal(vue_singular) %>Params) {
              create<%= Recase.to_pascal(vue_singular) %>(<%= vue_singular %>Params: $<%= vue_singular %>Params) {
                id
              }
            }
          `,
          variables: {
            <%= vue_singular %>Params
          }
        })

        setLoader(false)
        this.$toast.success({ message: this.$t('<%= vue_plural %>.created') })
        this.$router.push({ name: '<%= vue_plural %>' })
      } catch (err) {
        setLoader(false)
        this.$utils.showError(err)
      }
    }
  },

  i18n: {
    sharedMessages: locale
  }
}
</script>

<style lang="postcss" scoped>

</style>