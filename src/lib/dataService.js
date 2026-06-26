// Data access layer — swap these implementations for fetch() calls to wire up a real backend.
import { blogPosts } from '../data/blogPosts';

export const getPosts = () => blogPosts;
export const getPostBySlug = (slug) => blogPosts.find((p) => p.slug === slug) ?? null;
export const getLatestPost = () => blogPosts[0] ?? null;
