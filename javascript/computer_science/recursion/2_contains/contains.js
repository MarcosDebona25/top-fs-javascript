const contains = function(object, searchValue) {
    let valores = Object.values(object);
    if (valores.includes(searchValue)) return true;
    const objetosAnidados = valores.filter((valor) => typeof valor === 'object' && valor !== null);
    
    return objetosAnidados.some(obj => contains(obj, searchValue));
};
  
// Do not edit below this line
module.exports = contains;