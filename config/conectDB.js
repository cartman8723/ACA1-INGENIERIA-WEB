const mongoose = require("mongoose");
const dbNeme = "smart_cv";

/* URL conexion a la db  */
mongoose.connect(`mongodb://127.0.0.1:27017/${dbNeme}`)
    .then( async () => {
        console.log(`"Conectando a la DB: ${dbNeme}"`);
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log("📂 Colecciones:", collections.map(c => c.name));

})
    .catch((error) => console.log("Error al conctar con la DB", error));

module.exports = mongoose;