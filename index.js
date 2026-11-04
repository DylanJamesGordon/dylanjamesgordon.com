const path = require('path');
const express = require('express');

//Setup defaults for script
const app = express();

//Stylesheet
app.use(express.static(path.join(__dirname, 'public')));

//Webpage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//Anything else gets the same 404 page GitHub Pages serves
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
