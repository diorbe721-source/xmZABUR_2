const API_KEY = process.env.FAZERCARDS_API_KEY;

async function main() {
  const res = await fetch("https://api.fzr.cards/api/v2/topups/offers?category_id=mobile_legends_global", {
    headers: { "X-Api-Key": API_KEY }
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

main();