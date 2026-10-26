import axios from "axios";
import { apiBaseUrl } from "../../../services/apiBaseUrl.js";
import { attachCsrfHeader } from "../../../services/csrf.js";

const apiRootUrl = apiBaseUrl?.replace(/\/api\/auth\/?$/, "") ?? "";

const api = axios.create({
    baseURL: apiRootUrl,
    withCredentials: true,
});

api.interceptors.request.use((config) => attachCsrfHeader(config));

const SONG_MOODS = ["happy", "sad", "angry", "surprised", "neutral"];

export async function getSong({ mood }) {
    const response = await api.get("/api/songs", {
        params: { mood },
    });

    return response.data;
}

export async function getSongs() {
    const results = await Promise.all(
        SONG_MOODS.map((mood) => getSong({ mood }))
    );

    return results.flatMap(({ song }) =>
        Array.isArray(song) ? song : song ? [song] : []
    );
}

export async function uploadSong({ mood, file }) {
    const formData = new FormData();
    formData.append("mood", mood);
    formData.append("song", file);

    const response = await api.post("/api/songs", formData);
    return response.data;
}

export async function deleteSong(songId) {
    const response = await api.delete(`/api/songs/${songId}`);
    return response.data;
}
