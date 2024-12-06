const express = require('express');
const dotenv = require('dotenv');
const InstagramMessenger = require('./instagramMessenger');

dotenv.config();
const app = express();
app.use(express.json());

const messenger = new InstagramMessenger(
    process.env.INSTAGRAM_ACCESS_TOKEN,
    process.env.INSTAGRAM_ACCOUNT_ID
);

// Маршрут для проверки статуса сервера
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Получение всех сообщений
app.get('/messages', async (req, res) => {
    try {
        const messages = await messenger.getConversations();
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправка сообщения
app.post('/messages', async (req, res) => {
    try {
        const { recipientId, message } = req.body;
        if (!recipientId || !message) {
            return res.status(400).json({ error: 'Необходимы recipientId и message' });
        }
        
        const result = await messenger.sendMessage(recipientId, message);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Проверка токена
app.get('/verify-token', async (req, res) => {
    try {
        const isValid = await messenger.verifyToken();
        res.json({ isValid });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Проверка разрешений токена
app.get('/token-permissions', async (req, res) => {
    try {
        const permissions = await messenger.checkTokenPermissions();
        res.json(permissions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
}); 