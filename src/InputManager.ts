export class InputManager {
    private inputs: string[]

    public constructor(
        private readonly answers: string[],
        private readonly reveal: string,
    ) {
        this.inputs = answers.map(_ => "")
    }

    public getInputs() {
        return this.inputs
    }

    public loadInputs(inputs: string[]) {
        this.inputs = inputs
    }

    public setInput(input: string, index: number) {
        this.inputs[index] = input
    }

    public getCurrentReveal() {
        let currentReveal = this.reveal

        const replace = (str: string, index: number) => str.substring(0, index) + "?" + str.substring(index + 1)

        for (let i = 0; i < currentReveal.length; i++) {
            if (this.inputs[i] !== this.answers[i]) {
                currentReveal = replace(currentReveal, i)
            }
        }

        return currentReveal
    }
}
