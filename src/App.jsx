import React, { useState } from 'react';
import * as XLSX from 'xlsx';

export default function YouTubeScraper() {
  const [videoUrl, setVideoUrl] = useState('');
  const [commentRange, setCommentRange] = useState('0-500');
  const [order, setOrder] = useState('relevance');
  const [xlsxContent, setXlsxContent] = useState('');

  const handleRun = async () => {
    const videoIdMatch = videoUrl.match(/(?:v=|shorts\/)([\w-]+)/);
    const videoId = videoIdMatch ? videoIdMatch[1] : '';
    const API_KEY = 'AIzaSyBFT3AmOVlQWrt2mRxFZozxirIrpcFdbjI';
    const maxResults = parseInt(commentRange.split('-')[1], 10);
    let comments = [];
    let nextPageToken = '';

    while (comments.length < maxResults) {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&pageToken=${nextPageToken}&order=${order}&key=${API_KEY}`);
      const data = await response.json();
      if (!data.items) break;
      data.items.forEach(item => {
        const snippet = item.snippet.topLevelComment.snippet;
        comments.push({
          Author: snippet.authorDisplayName,
          Message: snippet.textDisplay.replace(/<[^>]+>/g, ''),
          'Published At': snippet.publishedAt,
          'Like Count': snippet.likeCount,
        });
      });
      if (!data.nextPageToken || comments.length >= maxResults) break;
      nextPageToken = data.nextPageToken;
    }

    const worksheet = XLSX.utils.json_to_sheet(comments);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Comments');

    const blob = new Blob([XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    setXlsxContent(url);
  };

  return (
    <div className="flex flex-col gap-6 p-10  mx-auto bg-gradient-to-br from-blue-50 to-white rounded-3xl shadow-2xl border border-gray-200 min-h-screen justify-center">
      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-8">📥 YouTube Comment Scraper</h1>
      <input type="text" placeholder="Paste YouTube video or Shorts link here..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black" />
      <div className="flex flex-col sm:flex-row gap-6">
        <select value={commentRange} onChange={(e) => setCommentRange(e.target.value)} className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black">
          <option value="0-500">0-500</option>
          <option value="500-1000">500-1000</option>
          <option value="1000-3000">1000-3000</option>
          <option value="3000-5000">3000-5000</option>
        </select>
        <select value={order} onChange={(e) => setOrder(e.target.value)} className="border border-gray-300 p-4 rounded-2xl w-full focus:outline-none focus:border-blue-500 transition text-lg text-black">
          <option value="relevance">Relevance</option>
          <option value="time">Newest</option>
        </select>
      </div>
      <button onClick={handleRun} className="bg-blue-600 text-white rounded-2xl p-4 text-lg hover:bg-blue-700 transition transform hover:scale-105">🚀 Run Scraper</button>
      {xlsxContent && (
        <a href={xlsxContent} download="comments.xlsx" className="text-center">
          <button className="bg-green-600 text-white rounded-2xl p-4 text-lg w-full hover:bg-green-700 transition transform hover:scale-105">⬇️ Download Excel</button>
        </a>
      )}
    </div>
  );
}
