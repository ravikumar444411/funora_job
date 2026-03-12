const axios = require("axios");

const GRAPH_API_BASE_URL = process.env.WHATSAPP_GRAPH_API_BASE_URL || "https://graph.facebook.com";
const GRAPH_API_VERSION = process.env.WHATSAPP_GRAPH_API_VERSION || "v25.0";
const REQUEST_TIMEOUT_MS = Number(process.env.WHATSAPP_REQUEST_TIMEOUT_MS || 15000);

const buildWhatsappTextRequest = ({ phoneNumberId, accessToken, to, message }) => {
  const url = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: message
    }
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  return { url, payload, headers };
};

const sendWhatsappTextMessage = async ({ phoneNumberId, accessToken, to, message }) => {
  const request = buildWhatsappTextRequest({ phoneNumberId, accessToken, to, message });
  const response = await axios.post(request.url, request.payload, {
    headers: request.headers,
    timeout: REQUEST_TIMEOUT_MS
  });
  return response.data;
};

const buildWhatsappTemplateRequest = ({
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = "en",
  bodyParameters = []
}) => {
  const url = `${GRAPH_API_BASE_URL}/${GRAPH_API_VERSION}/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: {
        code: languageCode
      },
      components: [
        {
          type: "body",
          parameters: bodyParameters.map((value) => ({
            type: "text",
            text: String(value ?? "")
          }))
        }
      ]
    }
  };

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json"
  };

  return { url, payload, headers };
};

const sendWhatsappTemplateMessage = async ({
  phoneNumberId,
  accessToken,
  to,
  templateName,
  languageCode = "en",
  bodyParameters = []
}) => {
  const request = buildWhatsappTemplateRequest({
    phoneNumberId,
    accessToken,
    to,
    templateName,
    languageCode,
    bodyParameters
  });

  const response = await axios.post(request.url, request.payload, {
    headers: request.headers,
    timeout: REQUEST_TIMEOUT_MS
  });

  return response.data;
};

module.exports = {
  buildWhatsappTextRequest,
  sendWhatsappTextMessage,
  buildWhatsappTemplateRequest,
  sendWhatsappTemplateMessage
};
