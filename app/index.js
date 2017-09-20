const initialSnake = {
  body: [],
  size: 5,
  positionX: 10,
  positionY: 10,
  directionX: 0,
  directionY: 0
};

const initialFood = {
  positionX: 15,
  positionY: 15
};

const initialUser = {
  score: 0
};

const addDirectionToPosition = direction => position => position + direction;
const isBiggerOrEqualsThan = grid => position => position >= grid;
const isPositionLessThan = num => position => position < num;
const isLessThanZero = isPositionLessThan(0);

const generalInformationRef = firebase.database().ref().child('generalInformation');

new Vue({
  el: '#app',
  data: {
    canvas: document.getElementById('canvas'),
    context: null,
    grid: 20,
    food: _.clone(initialFood),
    snake: _.clone(initialSnake),
    interval: null,
    isRunning: false,
    user: _.clone(initialUser),
    app: {
      highestScore: 0
    },
    configurationsKey: '',
    loading: false
  },
  mounted () {
    // generalInformationRef
    this.loading = true;
    generalInformationRef.limitToFirst(1)
      .once('value')
      .then(snapshot => {
        const obj = snapshot.val();
        this.configurationsKey = _.head(_.keys(obj));
        this.app = obj[this.configurationsKey];
        this.loading = false;
      })
      .catch(err => {
        alert('Não foi possível buscar o high score');
        console.log(err);
      })
  },
  watch: {
    user: {
      handler: function (newValue) {
        if (newValue.score > this.app.highestScore) {
          this.app.highestScore = newValue.score
          const data = {};
          data[this.configurationsKey] = this.app;
          generalInformationRef.update(data)
            .catch(error => console.error(error))
        }
      },
      deep: true
    }
  },
  methods: {
    start () {
      this.context = canvas.getContext('2d');
      document.addEventListener('keydown', event => {
        switch (event.keyCode) {
          case 37:
            this.snake.directionX = -1;
            this.snake.directionY = 0;
            break;
          case 38:
            this.snake.directionY = -1;
            this.snake.directionX = 0;
            break;
          case 39:
            this.snake.directionX = 1;
            this.snake.directionY = 0;
            break;
          case 40:
            this.snake.directionY = 1;
            this.snake.directionX = 0
            break;
        }
      });
      this.startWalking();
    },
    startWalking () {
      this.isRunning = true;
      this.snake.directionX = 1;
      this.snake.directionY = 0;
      this.continue();
    },
    pause () {
      this.isRunning = false;
      clearInterval(this.interval);
    },
    continue () {
      this.interval = setInterval(this.game, 100);
    },
    restart () {
      this.snake = _.clone(initialSnake);
      this.pause();
      this.startWalking();
      this.user.score = 0;
    },
    game () {
      const addDirectionXToPosition = addDirectionToPosition(this.snake.directionX);
      const addDirectionYToPosition = addDirectionToPosition(this.snake.directionY);

      this.snake.positionX = addDirectionXToPosition(this.snake.positionX);
      this.snake.positionY = addDirectionYToPosition(this.snake.positionY);

      const isBiggerOrEqualsThanGrid = isBiggerOrEqualsThan(this.grid);

      if (isBiggerOrEqualsThanGrid(this.snake.positionX)) {
        this.snake.positionX = 0; 
      }
      if (isLessThanZero(this.snake.positionX)) {
        this.snake.positionX = this.grid;
      }

      if (isBiggerOrEqualsThanGrid(this.snake.positionY)) {
        this.snake.positionY = 0; 
      }
      if (isLessThanZero(this.snake.positionY)) {
        this.snake.positionY = this.grid;
      }
      
      // background
      this.context.fillStyle = 'black';
      this.context.fillRect(0, 0, canvas.width, canvas.height);
      
      // snake
      this.context.fillStyle = '#82DF1F';
      this.snake.body.forEach((snakeBody, i) => {
        this.context.fillRect(snakeBody.x * this.grid, snakeBody.y * this.grid, this.grid - 1 , this.grid - 1);
        const didColide = snakeBody.x === this.snake.positionX && snakeBody.y === this.snake.positionY;
        if (didColide) {
          // if (confirm('You lose! Restart?')) {
          //   this.restart();
          //   return;
          // }
          this.snake.size = 5;
          this.user.score = 0;
        }
      });

      this.snake.body.push({ x: this.snake.positionX, y: this.snake.positionY });

      while (this.snake.body.length > this.snake.size) {
        this.snake.body.shift();
      }
      
      // food
      this.context.fillStyle = 'fuchsia';
      this.context.fillRect(this.food.positionX * this.grid, this.food.positionY * this.grid, this.grid - 1, this.grid - 1);
      const didEat = this.snake.positionX === this.food.positionX && this.snake.positionY === this.food.positionY;
      if (didEat) {
        this.snake.size = this.snake.size + 1;
        this.user.score = this.user.score + 1;
        this.food.positionX = Math.floor(Math.random() * this.grid);
        this.food.positionY = Math.floor(Math.random() * this.grid);
      }
    }
  }
})
