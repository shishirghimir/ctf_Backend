// create user
const createUser =(req, res) => {
    res.send('User Created');
};

const login =(req, res) => {
    res.send('LOGIN SUCESSFUL');
};

const Products =(req, res) => {
    res.send('Products are Given Below:');
};

module.exports = {
    createUser,
    login,
    Products,
};
