const limitArray = (array, limit = 20) => {
    if (!Array.isArray(array)) {
      console.warn("¡No es un arreglo!", array);
      return [];
    }
    return array.slice(0, limit);
  };

module.exports = limitArray;