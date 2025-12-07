async function likePost(postId: string) {
  const res = await fetch("/api/like", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postId }),
  });

  if (res.status === 409) {
    return {
      ok: false,
      alreadyLiked: true,
    };
  }

  const data = await res.json();
  return data; 
}

export default function LikeButton({ postId }: { postId: string }) {
  return (
    <button onClick={() => likePost(postId)}>
      Like
    </button>
  );
}
