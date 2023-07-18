class NumberWord {
    below100(number, num1, num2, num_belasan) {
        if (number < 10) {
            return num1[number];
        } else if (number < 20) {
            return num_belasan[number - 10];
        } else {
            return num2[Math.floor(number / 10)] + ' ' + num1[number % 10];
        }
    }

    numberToWords(number) {
        const num1 = [
            '',
            'satu',
            'dua',
            'tiga',
            'empat',
            'lima',
            'enam',
            'tujuh',
            'delapan',
            'sembilan',
        ];
        const num2 = [
            '',
            'sepuluh',
            'dua puluh',
            'tiga puluh',
            'empat puluh',
            'lima puluh',
            'enam puluh',
            'tujuh puluh',
            'delapan puluh',
            'sembilan puluh',
        ];
        const num_belasan = [
            'sepuluh',
            'sebelas',
            'dua belas',
            'tiga belas',
            'empat belas',
            'lima belas',
            'enam belas',
            'tujuh belas',
            'delapan belas',
            'sembilan belas',
        ];
        let words = '';

        if (number === 0) {
            return 'nol';
        }

        if (number >= 1000000000000) {
            words +=
                this.below100(
                    Math.floor(number / 1000000000000),
                    num1,
                    num2,
                    num_belasan,
                ) + ' triliyun ';
            number %= 1000000000000;
        }

        if (number >= 1000000000) {
            words +=
                this.below100(
                    Math.floor(number / 1000000000),
                    num1,
                    num2,
                    num_belasan,
                ) + ' miliar ';
            number %= 1000000000;
        }

        if (number >= 1000000) {
            words +=
                this.below100(
                    Math.floor(number / 1000000),
                    num1,
                    num2,
                    num_belasan,
                ) + ' juta ';
            number %= 1000000;
        }

        if (number >= 100000) {
            words +=
                this.below100(
                    Math.floor(number / 100000),
                    num1,
                    num2,
                    num_belasan,
                ) + ' ratus ';
            number %= 100000;
        }

        if (number >= 1000) {
            words +=
                this.below100(
                    Math.floor(number / 1000),
                    num1,
                    num2,
                    num_belasan,
                ) + ' ribu ';
            number %= 1000;
        }

        if (number >= 100) {
            words +=
                this.below100(
                    Math.floor(number / 100),
                    num1,
                    num2,
                    num_belasan,
                ) + ' ratus';
            number %= 100;
        }

        words += this.below100(number, num1, num2, num_belasan);

        return words.trim().replace(/\s+/g, ' ');
    }
}

const wordNum = new NumberWord();
// console.log(wordNum.numberToWords(67005));

export default (number) => wordNum.numberToWords(number);
