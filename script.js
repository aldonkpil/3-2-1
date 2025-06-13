
const questionsUrl = 'questions.json';

let questions = [];
let currentIndex = 0;
let scores = {};
let detailedStats = {};
let timer;
let timeLeft = 30 * 60;

function startTimer() {
  const timerDisplay = document.getElementById('timer');
  timer = setInterval(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `⏳ ${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    if (timeLeft <= 0) {
      clearInterval(timer);
      showTimeoutMessage();
    }
    timeLeft--;
  }, 1000);
}

function showTimeoutMessage() {
  document.getElementById('app').innerHTML = `
    <h2>Η δοκιμασία ολοκληρώθηκε λόγω ολοκλήρωσης του χρόνου.</h2>
    <p>⚠️ Σύμφωνα με τις οδηγίες του ΑΣΕΠ, εάν δεν ολοκληρώσετε όλη τη δοκιμασία, δηλαδή δεν απαντήσετε και στις 76 τριάδες δηλώσεων, η βαθμολογία της συγκεκριμένης δοκιμασίας είναι ΜΗΔΕΝΙΚΗ.</p>
  `;
}

function loadQuestion() {
  if (currentIndex >= questions.length) {
    clearInterval(timer);
    showResults();
    return;
  }

  const question = questions[currentIndex];
  const app = document.getElementById('app');
  app.innerHTML = `
    
    <h2>Τριάδα ${question.id}</h2><hr><h3>Ποια δήλωση σας περιγράφει καλύτερα;</h3>
    <div id="answers">
      ${question.statements.map((s, i) => `
        <div class="answer" data-index="${i}">${s.text}</div>
      `).join('')}
    </div>
  `;

  document.querySelectorAll('.answer').forEach(el => {
    el.addEventListener('click', () => {
      const firstIndex = parseInt(el.getAttribute('data-index'));
      const remaining = [0, 1, 2].filter(i => i !== firstIndex);
      const firstSkill = question.statements[firstIndex].skill;

      // Πόντοι για 1η επιλογή
      if (!scores[firstSkill]) scores[firstSkill] = { count: 0, total: 0 };
      scores[firstSkill].count += 1;
      scores[firstSkill].total += 3;

      if (!detailedStats[firstSkill]) detailedStats[firstSkill] = { first: 0, second: 0, third: 0 };
      detailedStats[firstSkill].first += 1;

      const app = document.getElementById('app');
      app.innerHTML = `
        
        <h2>Τριάδα ${question.id}</h2><hr><h3>Επιλέξτε ποια από τις δύο εναπομείνασες δηλώσεις σας περιγράφει καλύτερα:</h3>
        <div id="answers">
          ${remaining.map(i => `
            <div class="answer" data-index="${i}">${question.statements[i].text}</div>
          `).join('')}
        </div>
      `;

      document.querySelectorAll('.answer').forEach(secondEl => {
        secondEl.addEventListener('click', () => {
          const secondIndex = parseInt(secondEl.getAttribute('data-index'));
          const thirdIndex = remaining.find(i => i !== secondIndex);
          const secondSkill = question.statements[secondIndex].skill;
          const thirdSkill = question.statements[thirdIndex].skill;

          if (!scores[secondSkill]) scores[secondSkill] = { count: 0, total: 0 };
          scores[secondSkill].count += 1;
          scores[secondSkill].total += 2;

          if (!scores[thirdSkill]) scores[thirdSkill] = { count: 0, total: 0 };
          scores[thirdSkill].count += 1;
          scores[thirdSkill].total += 1;

          if (!detailedStats[secondSkill]) detailedStats[secondSkill] = { first: 0, second: 0, third: 0 };
          if (!detailedStats[thirdSkill]) detailedStats[thirdSkill] = { first: 0, second: 0, third: 0 };
          detailedStats[secondSkill].second += 1;
          detailedStats[thirdSkill].third += 1;

          currentIndex++;
          loadQuestion();
        });
      });
    });
  });
}

function showResults() {
  const app = document.getElementById('app');
  let totalPercent = 0;
  let resultHtml = "<h2>Αποτελέσματα με κανόνα 3-2-1 βαθμών</h2><table border='1'><tr><th>Δεξιότητα</th><th>Εμφανίσεις</th><th>1η Επιλ.</th><th>2η Επιλ.</th><th>Μη Επιλ.</th><th>Συνολικοί Πόντοι</th><th>Μέγιστο Δυνατό</th><th>%</th></tr>";

  Object.keys(scores).forEach(skill => {
    const max = scores[skill].count * 3;
    const percent = ((scores[skill].total / max) * 100).toFixed(2);
    totalPercent += parseFloat(percent);
    const first = detailedStats[skill]?.first || 0;
    const second = detailedStats[skill]?.second || 0;
    const third = detailedStats[skill]?.third || 0;

    resultHtml += `<tr>
      <td>${skill}</td>
      <td>${scores[skill].count}</td>
      <td>${first}</td>
      <td>${second}</td>
      <td>${third}</td>
      <td>${scores[skill].total}</td>
      <td>${max}</td>
      <td>${percent}%</td>
    </tr>`;
  });

  const avg = (totalPercent / Object.keys(scores).length).toFixed(2);
  resultHtml += `</table><h3>Μέσος Όρος: ${avg}%</h3>`;
  //resultHtml += `<canvas id="chart" width="400" height="300"></canvas>`;
  app.innerHTML = resultHtml;

  // Προσθήκη επεξήγησης υπολογισμού ποσοστών
  const explanation = document.createElement('div');
  explanation.style.marginTop = '2rem';
  explanation.style.padding = '1rem';
  explanation.style.backgroundColor = '#fff';
  explanation.style.borderRadius = '8px';
  explanation.style.fontSize = '14px';
  explanation.style.lineHeight = '1.6';
  explanation.innerHTML = `
    <h3>Πώς υπολογίζονται τα ποσοστά;</h3>
    <p>Η κάθε τριάδα δίνει αντίστοιχα 3-2-1 βαθμό (3 βαθμοί η απάντηση που επιλέχθηκε πρώτη, 2 η δεύτερη και 1 βαθμός αυτή που δεν επιλέχθηκε).</p>
    <p>Αν π.χ. εμφανιστούν 28 ερωτήσεις που σχετίζονται με τη δεξιότητα "Προσανατολισμός στο αποτέλεσμα" και ο χρήστης επιλέξει 21 φορές τη σχετική απάντηση ως πρώτη επιλογή, 4 φορές ως δεύτερη και 3 φορές ως τρίτη//, αυτό σημαίνει πως θα συγκεντρώσει 74 πόντους με μέγιστους τους 84. Αυτό σημαίνει πως γι' αυτή τη δεξιότητα συγκεντρώνει ποσοστό 88,01%.</p>
    <p>Παράδειγμα για "Προσαρμοστικότητα": Αν εμφανιστούν 24 ερωτήσεις που σχετίζονται με αυτή τη δεξιότητα και ο χρήστης επιλέξει 14 φορές τη σχετική απάντηση ως πρώτη επιλογή, 6 φορές ως δεύτερη και 2 φορές ως τρίτη, αυτό σημαίνει πως θα συγκεντρώσει 56 πόντους με μέγιστους τους 72. Έτσι γι' αυτή τη δεξιότητα συγκεντρώνει ποσοστό 77,78%.</p>
  `;
  app.appendChild(explanation);


  const ctx = document.getElementById('chart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: Object.keys(scores),
      datasets: [{
        label: '% ανά δεξιότητα',
        data: Object.values(scores).map(s => ((s.total / (s.count * 3)) * 100).toFixed(2)),
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

window.onload = async function() {
  const res = await fetch(questionsUrl);
  questions = await res.json();
  loadQuestion();
  startTimer();
};
