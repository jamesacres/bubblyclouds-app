import { Project } from '@bubblyclouds-app/blog/types/siteTypes';

const projectsData: Project[] = [
  {
    title: 'Bubbly Clouds',
    description: `Bubbly Clouds is James Acres' sole trader business identity. It is the parent brand of upcoming projects. Between October 2013 and September 2021 it operated as a web hosting, SSL and domain business. This business stopped operating due to rising costs from cPanel and WHMCS partners and a decline in clients following the 2020 pandemic. I provided various local businesses across the South of England with PHP, Node.js, Python, Perl and more with the industry leading cPanel and WHM, all of which I managed at Linode. I provided personal technical support across a wide range of web, email networking and sysadmin issues, plus of course the usual business as usual.`,
    imgSrc: '/content/images/projects/bubbly-clouds-invert.png',
    href: 'https://bubblyclouds.com',
  },
  {
    title: 'Sudoku Race',
    description: `- 🤾‍♂️ Share a Sudoku with family and friends - race to see who can complete it fastest
- 🏎️ Private racing team and leaderboard
- 🌱 Sudoku of the day - Three new challenges each day
- 📖 Monthly puzzle book - Technique-focused puzzles to challenge your skills
- 📸 Import a Sudoku - Scan any Sudoku from books, newspapers, or websites and challenge your friends to solve the same puzzle
- 🎨 Multiple themes in both Light Mode and Dark Mode!
`,
    imgSrc: '/content/images/projects/sudoku-race.png',
    href: 'https://sudoku.bubblyclouds.com/',
  },
  {
    title: 'Unblock Race',
    description: `- 🧩 Slide the blocks and clear the jam to free the glowing piece - race the clock to the exit
- 🏁 Daily race - five boards of increasing difficulty, fastest escape wins
- 📅 Monthly collection - 50 fresh puzzles to clear before the month is out
- 🏎️ Racing teams - challenge friends and family to a private leaderboard
- 🏆 Track your stats - moves, time and star ratings across every puzzle you solve
`,
    href: 'https://unblockrace.bubblyclouds.com/',
  },
  {
    title: 'Stephen Esch Music Rating',
    description: `A website hosting music ratings for Stephen Esch. Now running version two which is a statically generated site with React and Next.js. Version one was dynamic using Node.js, Knox+Postgres, S3, AngularJS.`,
    imgSrc: '/content/images/projects/stephen-music.png',
    href: 'https://stephenesch.co.uk/',
  },
  {
    title: 'Eurovisionr',
    description: `Now offline, a collaboration with Jade Elliott, a fun, simple and interactive way to pick the song you want to support at the current year's Eurovision Song Contest. eurovisionr started in 2013 with category filters and has just been relaunched for 2014 with new ranking features. The AngularJS frontend requested data from a Node.js powered backend API which connected to a MongoDB database and returned JSON.`,
  },
  {
    title: 'Geolert Location Based Mobile Coupons',
    description: `Final year project at University of Southampton. In this project a location-based coupon application is designed, implemented, tested and evaluated. Merchants add coupons into the website application which are then pushed to consumer Android devices as they enter merchant brick and mortar places using geofences.`,
  },
];

export default projectsData;
