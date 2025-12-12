const rates = {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      INR: 83.5,
      JPY: 150
    };

    const amountInput = document.getElementById('amount');
    const fromSelect = document.getElementById('from');
    const toSelect = document.getElementById('to');
    const resultDiv = document.getElementById('result');

    function convertAndShow() {
      const amount = parseFloat(amountInput.value);
      if (isNaN(amount)) { resultDiv.textContent = '—'; return; }

      const from = fromSelect.value;
      const to = toSelect.value;

      const fromRate = rates[from] ?? 1;
      const toRate = rates[to] ?? 1;

      const converted = amount * (toRate / fromRate);

      resultDiv.textContent = amount + ' ' + from + ' = ' + converted.toFixed(2) + ' ' + to;
    }

    amountInput.addEventListener('input', convertAndShow);
    fromSelect.addEventListener('change', convertAndShow);
    toSelect.addEventListener('change', convertAndShow);

    document.getElementById('convert').addEventListener('click', function(e){ e.preventDefault(); convertAndShow(); });

    convertAndShow();