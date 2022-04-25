<template>
  <div>
     <h2>{{ msg }}</h2>
      <img width="200px" src="https://cn.vuejs.org/images/logo.svg" />
      <div>
      <p>{{ count }}</p>
      <button @click="count++">add</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      msg: 'Hello, Vue!',
      count: 0
    }
  }
}
</script>

<style scoped>

</style>
