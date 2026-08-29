"use client"
import React from "react";
import styles from "./eventCard.module.css";
import Link from "next/link";

interface EventProps {
    chooseCareer?: boolean; 
}

const jobs = [
    { title: "Doctor", salary: "200k", minEducation: 12, imgsrc: "/doctor.png" },
    { title: "Software Engineer", salary: "150k", minEducation: 8, imgsrc: "/engineer.png" },
    { title: "Entrepreneur", salary: "10-320k", minEducation: 6, imgsrc: "/entrepreneur.png" },
    { title: "Barista", salary: "200k", minEducation: 0, imgsrc: "/barista.png" },
];

export default function Event(/*{ chooseCareer = false }: EventProps*/) {
    
    return (
        <div>
            <div className={styles.head}>
                <div className={styles.topic}>Event</div>
                <div className={styles.topic}>⌛️4/9</div>
            </div>
            <div className={styles.container}>
                {/* {chooseCareer ? ( */}
                    {/* <div>
                        <h2 className={styles.title}>Apply for your job</h2>
                    <div className={styles.jobList}>{jobs.map((job, index) => (
                        <div key={index} className={styles.jobCard}>
                        <div className={styles.jobImage}>
                            <img src={job.imgsrc} alt="Job Icon" />
                        </div>
                        <div className={styles.jobInfo}>
                            <h3>{job.title}</h3>
                            <p><strong>${job.salary}</strong></p>
                            <p>Min 🎓 {job.minEducation}</p>
                            <button className={styles.applyButton}>Apply</button>
                        </div>
                        </div>
                        ))}
                    </div>
                    </div> */}
                {/* )
                :
                (*/
                <div>
                    <h2 className={styles.title}>Oh no, a Car Accident!!!</h2>
                    <div className={styles.imageContainer}>
                        <img src="crash.png" alt="Car Accident" className={styles.image} />
                    </div>
                    <p className={styles.description}>
                    You're driving along when—<strong>BAM!</strong>— another car swerves into your lane! 
                    A loud crunch echoes as metal bends, glass shatters, and your heart pounds. 
                    The damage isn't catastrophic, but your car is definitely worse for wear.
                    </p>
                    <div className={styles.options}>
                    <Link href="/outcome"><button className={`${styles.btn} ${styles.disabledOption}`}>☎️ Call Insurance<br />(Required: Car Insurance)</button></Link>
                    <Link href="/outcome"><button className={`${styles.btn} ${styles.payOption}`}>💸 Pay Out of Pocket ($30k, 😁 -40)</button></Link>
                    <Link href="/outcome"><button className={`${styles.btn} ${styles.settleOption}`}>
                            🤝 Try to Settle Privately<br />(70%: $10k, 😁 -10 | <br />30%: $40k, 😁 -60)
                        </button>
                        </Link>
                    </div>
                </div>
                /*)} */}
            </div>
      </div>
  );
};

