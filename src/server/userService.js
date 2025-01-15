import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.join(__dirname, "data", "users.json");

function loadUsers() {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ users: [] }, null, 2));
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data).users;
}

function saveUsers(users) {
    fs.writeFileSync(filePath, JSON.stringify({ users }, null, 2));
}

function findUserByWallet(walletAddress) {
    const users = loadUsers();
    const user = users.find(user => user.walletAddress === walletAddress);
    return user ? user.userId : null;
}

function addUser(walletAddress) {
    let users = loadUsers();

    if (findUserByWallet(walletAddress)) {
        console.log("User already exists!");
        return;
    }

    const newUser = {
        userId: String(users.length + 1),
        walletAddress
    };

    users.push(newUser);
    saveUsers(users);

    console.log("User added:", newUser);
    return newUser.userId;
}

// eslint-disable-next-line import/no-anonymous-default-export
export default {
    findUserByWallet,
    addUser,
    loadUsers,
    saveUsers
};
