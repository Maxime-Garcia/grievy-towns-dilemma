using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class degatZoneTeleport : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {

    }

    // Update is called once per frame
    void Update()
    {

    }

    void OnTriggerEnter2D(Collider2D other){
      // print(other);
      if(!other.isTrigger && other.gameObject.tag == "Player" && !other.gameObject.GetComponent<DashMove>().dashing && !other.gameObject.GetComponent<PlayerController>().isTriggCheckPoint){
        other.gameObject.GetComponent<PlayerController>().isTriggCheckPoint = true;
        other.gameObject.transform.position = other.gameObject.GetComponent<PlayerController>().seaCheckPoint.position;
        other.gameObject.GetComponent<PlayerHealth>().TakeAHit(0.5f);
        StartCoroutine(HitTimer());
      }
    }

    IEnumerator HitTimer() {
      // print("Hit Enemy...");
      yield return new WaitForSeconds(1);
      GameObject.FindWithTag("Player").GetComponent<PlayerController>().isTriggCheckPoint = false;
    }
}
