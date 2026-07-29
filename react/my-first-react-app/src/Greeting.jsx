function Greeting() {
    return (
        <>
        <h1>"I swear by my pretty floral bonnet, I will end you."</h1>
        <p>That's kind of cringe, to be honest!</p>
        </>
    )
}

export function MyName({ name = "Marcos" }) {
    return (
        <>
        <h1>Full Name</h1>
        <p>My name is {name} Debona</p>
        </>
    )
}

export function MyBirthday() {
    let day = 25;
    let month = "June";
    let year = 2004;
    
    return (
        <>
        <h2>Birthday</h2>
        <p>My birthday is {day} {month} {year}</p>
        </>
    )
}

export default Greeting;