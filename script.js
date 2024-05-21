const wheel = document.getElementById("wheel");
const spinBtn = document.getElementById("spin-btn");
const finalValue = document.getElementById("final-value");
//Object that stores values of minimum and maximum angle for a value
const rotationValues = [
  { minDegree: 0, maxDegree: 30, value: 2 },
  { minDegree: 31, maxDegree: 90, value: 1 },
  { minDegree: 91, maxDegree: 150, value: 6 },
  { minDegree: 151, maxDegree: 210, value: 5 },
  { minDegree: 211, maxDegree: 270, value: 4 },
  { minDegree: 271, maxDegree: 330, value: 3 },
  { minDegree: 331, maxDegree: 360, value: 2 },
];
//Size of each piece
let data = [1, 1, 1, 1, 1, 1];
let dataAdd = [];
//background color for each piece
var pieColors = [
  "#8b35bc",
  "#b163da",
  "#8b35bc",
  "#b163da",
  "#8b35bc",
  "#b163da",
];
//Create chart
let myChart = new Chart(wheel, {
  //Plugin for displaying text on pie chart
  plugins: [ChartDataLabels],
  //Chart Type Pie
  type: "pie",
  data: {
    //Labels(values which are to be displayed on chart)
    labels: [
      1, 2, 3, 4, 5, 6
    ],
    //Settings for dataset/pie
    datasets: [
      {
        backgroundColor: pieColors,
        data: data,
      },
    ],
  },
  options: {
    //Responsive chart
    responsive: true,
    animation: { duration: 0 },
    plugins: {
      //hide tooltip and legend
      tooltip: false,
      legend: {
        display: false,
      },
      //display labels inside pie chart
      datalabels: {
        color: "#ffffff",
        formatter: (_, context) => context.chart.data.labels[context.dataIndex],
        font: { size: 24 },
      },
    },
  },
});
//display value based on the randomAngle
const valueGenerator = (angleValue) => {
  console.log(dataAdd);
  for (let i of rotationValues) {
    //if the angleValue is between min and max then display it
    if (angleValue >= i.minDegree && angleValue <= i.maxDegree) {
      if (i.value > dataAdd.length) {
        finalValue.innerHTML = `<p style="font-size: 15px;" class="alert alert-warning">Em quay lại lượt mới nhaaa <333</p>`;
        window.alert("Item này chưa đc add nhó. Em iuu add thêm hoặc quay lượt mới nha. hic hic :(((");
      } else {
        finalValue.innerHTML = `<p>Value: ${dataAdd[i.value - 1]}</p>`;
      }
      spinBtn.disabled = false;
      break;
    }
  }
};

//Spinner count
let count = 0;
//100 rotations for animation and last rotation for result
let resultValue = 101;
//Start spinning
spinBtn.addEventListener("click", () => {
  if (dataAdd.length > 0) {
    spinBtn.disabled = true;
    //Empty final value
    finalValue.innerHTML = `<p style="font-size: 15px;" class="alert alert-success">Chúc em cầu được ước thấy nhaaa!</p>`;
    //Generate random degrees to stop at
    let randomDegree = Math.floor(Math.random() * (355 - 0 + 1) + 0);
    console.log(randomDegree);
    //Interval for rotation animation
    let rotationInterval = window.setInterval(() => {
      //Set rotation for piechart
      /*
      Initially to make the piechart rotate faster we set resultValue to 101 so it rotates 101 degrees at a time and this reduces by 1 with every count.
       Eventually on last rotation we rotate by 1 degree at a time.
      */
      myChart.options.rotation = myChart.options.rotation + resultValue;
      //Update chart with new value;
      myChart.update();
      //If rotation>360 reset it back to 0
      if (myChart.options.rotation >= 360) {
        count += 1;
        resultValue -= 5;
        myChart.options.rotation = 0;
      } else if (count > 15 && myChart.options.rotation == randomDegree) {
        valueGenerator(randomDegree);
        clearInterval(rotationInterval);
        count = 0;
        resultValue = 101;
      }
    }, 10);
  } else {
    window.alert("Sao Em iuuu chưa thêm gì vào danh sách mà đã quay thế. hic hic :(((");
  }

});

// Sample array
// let array = [10, 20, 30, 40, 50,60];

// Function to display array values in the table
function displayArrayInTable(array) {
  // Get the table body element
  const tableBody = document.querySelector('#arrayTable tbody');

  // Clear any existing rows in the table body
  tableBody.innerHTML = '';

  // Loop through the array and create a row for each element
  array.forEach((value, index) => {
    // Create a new row element
    const row = document.createElement('tr');

    // Create a cell for the index
    const indexCell = document.createElement('td');
    indexCell.textContent = index + 1;

    // Create a cell for the value
    const valueCell = document.createElement('td');
    const inputValue = document.createElement('input');
    inputValue.className = 'form-control';
    inputValue.type = 'text';
    inputValue.value = value;
    inputValue.addEventListener('change', () => {
      array[index] = inputValue.value;
    });
    valueCell.appendChild(inputValue);

    // Create a cell for the actions
    const actionCell = document.createElement('td');
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'btn btn-danger';
    deleteButton.onclick = () => {
      deleteRow(index);
    };
    actionCell.appendChild(deleteButton);

    // Append the cells to the row
    row.appendChild(indexCell);
    row.appendChild(valueCell);
    row.appendChild(actionCell);

    // Append the row to the table body
    tableBody.appendChild(row);
  });
}

const alert = document.getElementById("al1");
// Function to add a new row
function addRow() {
  if (dataAdd.length < 6) {
    dataAdd.push("Item"); // Adding a default value (Item) to the array
    displayArrayInTable(dataAdd);
  } else {
    window.alert("Em iuuu tham thế :)). Em add tối đa 6 items thui nhó !!!");
  }
}

// Function to delete a row
function deleteRow(index) {
  dataAdd.splice(index, 1);
  displayArrayInTable(dataAdd);
}

function resetListAdd() {
  dataAdd = [];
  displayArrayInTable(dataAdd);
}

// Initial display of the array
displayArrayInTable(dataAdd);