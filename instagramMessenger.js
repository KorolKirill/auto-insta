const axios = require('axios');

class InstagramBusinessMessenger {
    constructor(accessToken, instagramAccountId) {
        this.accessToken = accessToken;
        this.instagramAccountId = instagramAccountId;
        this.apiVersion = 'v21.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
        this.messageHandlers = new Set();
    }

    async getConversations() {
        try {
            const endpoint = `${this.baseUrl}/${this.instagramAccountId}/conversations`;
            const params = {
                access_token: this.accessToken,
                fields: 'from,message,created_time'
            };
            
            const response = await axios.get(endpoint, { params });
            const data = response.data;
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            return data;
        } catch (error) {
            throw new Error(`Ошибка при получении сообщений: ${error.message}`);
        }
    }

    async sendMessage(recipientId, messageText) {
        try {
            const endpoint = `${this.baseUrl}/${this.instagramAccountId}/messages`;
            const data = {
                recipient: { id: recipientId },
                message: { text: messageText },
                access_token: this.accessToken
            };
            
            const response = await axios.post(endpoint, data);
            return response.data;
        } catch (error) {
            throw new Error(`Ошибка при отправке сообщения: ${error.message}`);
        }
    }

    // Подписка на новые сообщения
    onNewMessage(handler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    // Запуск мониторинга сообщений
    startMonitoring(checkInterval = 30) {
        let lastCheck = new Date();
        
        const checkMessages = async () => {
            try {
                const messagesData = await this.getConversations();
                const currentTime = new Date();
                
                if (messagesData?.data) {
                    for (const message of messagesData.data) {
                        const messageTime = new Date(message.created_time);
                        
                        if (messageTime > lastCheck) {
                            // Уведомляем всех подписчиков о новом сообщении
                            this.messageHandlers.forEach(handler => {
                                handler({
                                    sender: String(message.from?.id) === String(this.instagramAccountId) ? 'self' : 'client',
                                    time: messageTime,
                                    text: message.message || '',
                                    raw: message
                                });
                            });
                        }
                    }
                }
                
                lastCheck = currentTime;
            } catch (error) {
                console.error('Ошибка при проверке сообщений:', error);
            }
        };

        const interval = setInterval(checkMessages, checkInterval * 1000);
        return () => clearInterval(interval);
    }

    async verifyToken() {
        try {
            const endpoint = `${this.baseUrl}/${this.instagramAccountId}`;
            const params = {
                access_token: this.accessToken,
                fields: 'id,username'
            };
            
            const response = await axios.get(endpoint, { params });
            const data = response.data;
            
            if (data.error) {
                throw new Error(data.error.message);
            }
            
            return true;
        } catch (error) {
            throw new Error(`Ошибка при проверке маркера: ${error.message}`);
        }
    }

    async checkTokenPermissions() {
        try {
            const endpoint = `${this.baseUrl}/debug_token`;
            const params = {
                input_token: this.accessToken,
                access_token: this.accessToken
            };
            
            const response = await axios.get(endpoint, { params });
            return response.data;
        } catch (error) {
            throw new Error(`Ошибка при проверке разрешений: ${error.message}`);
        }
    }
}

module.exports = InstagramBusinessMessenger; 